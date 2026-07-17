import { prisma } from './db';
import { getNoteContent, createNote } from '@/app/actions/notes';
import { createTask, updateTaskStatus } from '@/app/actions/task-actions';

// Sprint 6.3: tools de SOLO LECTURA para el asistente. Cada tool invoca
// queries/Server Actions YA EXISTENTES, sin reimplementar lógica (regla
// dura del proyecto). Separado de assistant-context.ts (architect): ese
// módulo es system prompt pasivo (una sola llamada por turno); este es
// definición + dispatcher activo, ejecutado durante el loop de tool_use.

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'listar_proyectos',
      description: 'Lista TODOS los proyectos del usuario (no solo los activos), con su estado, prioridad y progreso.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_tareas',
      description: 'Lista tareas, opcionalmente filtradas por proyecto y/o estado.',
      parameters: {
        type: 'object',
        properties: {
          proyecto_nombre: { type: 'string', description: 'Nombre (o parte del nombre) del proyecto para filtrar. Omitir para todas.' },
          estado: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'WAITING', 'DONE'], description: 'Estado para filtrar. Omitir para todos.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_tareas_por_texto',
      description: 'Busca tareas cuyo título contenga el texto dado (substring simple; sin distinguir mayúsculas en ASCII, pero SÍ distingue acentos — usa el texto tal como aparecería escrito, con acentos si los tiene).',
      parameters: {
        type: 'object',
        properties: { texto: { type: 'string', description: 'Texto a buscar en el título de la tarea.' } },
        required: ['texto'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'leer_nota_contexto',
      description: 'Lee la(s) nota(s) de contexto Markdown de un proyecto (información de fondo del proyecto, no tareas).',
      parameters: {
        type: 'object',
        properties: { proyecto_nombre: { type: 'string', description: 'Nombre (o parte del nombre) del proyecto.' } },
        required: ['proyecto_nombre'],
      },
    },
  },
] as const;

// Sprint 6.4: tools de ESCRITURA. Regla dura no negociable de la sesión:
// NINGUNA ejecuta sin confirmación explícita del usuario. La confirmación
// NUNCA la decide el modelo (ver route.ts: cuando el loop encuentra una de
// estas, el servidor pausa y devuelve una propuesta -- solo un clic real
// del usuario en la UI dispara la segunda petición que sí ejecuta).
export const WRITE_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'crear_tarea',
      description: 'Crea una tarea nueva. Requiere confirmación del usuario antes de guardarse.',
      parameters: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          proyecto_nombre: { type: 'string', description: 'Proyecto al que pertenece. Omitir para Inbox sin clasificar.' },
          prioridad: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          fecha: { type: 'string', description: 'Fecha límite YYYY-MM-DD, opcional.' },
        },
        required: ['titulo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crear_nota',
      description: 'Crea una nota de contexto Markdown para un proyecto. Requiere confirmación del usuario.',
      parameters: {
        type: 'object',
        properties: {
          proyecto_nombre: { type: 'string' },
          titulo: { type: 'string' },
          contenido: { type: 'string' },
        },
        required: ['proyecto_nombre', 'titulo', 'contenido'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'completar_tarea',
      description: 'Marca una tarea existente como completada (DONE). Requiere confirmación del usuario.',
      parameters: {
        type: 'object',
        properties: { titulo: { type: 'string', description: 'Título (o parte) de la tarea a completar.' } },
        required: ['titulo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mover_archivo_a_proyecto',
      description: 'Mueve un archivo/nota existente a otro proyecto. Requiere confirmación del usuario.',
      parameters: {
        type: 'object',
        properties: {
          archivo_titulo: { type: 'string' },
          proyecto_destino: { type: 'string' },
        },
        required: ['archivo_titulo', 'proyecto_destino'],
      },
    },
  },
] as const;

export const WRITE_TOOL_NAMES = new Set(WRITE_TOOL_DEFINITIONS.map((t) => t.function.name));

async function findProjectByName(nombre: string) {
  return prisma.proyecto.findFirst({
    where: { name: { contains: nombre } },
  });
}

async function listarProyectos() {
  const projects = await prisma.proyecto.findMany({
    orderBy: { name: 'asc' },
    select: { name: true, status: true, priority: true, progress: true },
  });
  return projects;
}

async function listarTareas(args: { proyecto_nombre?: string; estado?: string }) {
  const where: Record<string, unknown> = {};
  if (args.estado) where.status = args.estado;
  if (args.proyecto_nombre) {
    const project = await findProjectByName(args.proyecto_nombre);
    if (!project) return { error: `No se encontró ningún proyecto que contenga "${args.proyecto_nombre}".` };
    where.projectId = project.id;
  }
  const tasks = await prisma.tarea.findMany({
    where,
    select: { title: true, status: true, priority: true, dueDate: true },
    take: 50,
  });
  return tasks;
}

async function buscarTareasPorTexto(args: { texto: string }) {
  const tasks = await prisma.tarea.findMany({
    where: { title: { contains: args.texto } },
    select: { title: true, status: true, priority: true, dueDate: true },
    take: 20,
  });
  return tasks;
}

async function leerNotaContexto(args: { proyecto_nombre: string }) {
  const project = await findProjectByName(args.proyecto_nombre);
  if (!project) return { error: `No se encontró ningún proyecto que contenga "${args.proyecto_nombre}".` };

  const notas = await prisma.archivo.findMany({
    where: { projectId: project.id, kind: 'NOTE' },
    select: { id: true, title: true },
  });
  if (notas.length === 0) return { error: `El proyecto "${project.name}" no tiene notas de contexto.` };

  const contents = await Promise.all(notas.map((n) => getNoteContent(n.id)));
  return notas.map((n, i) => ({ titulo: n.title, contenido: contents[i] }));
}

// --- Ejecutores de escritura (llamados SOLO tras confirmación real, ver route.ts) ---

async function crearTarea(args: { titulo: string; proyecto_nombre?: string; prioridad?: string; fecha?: string }) {
  const fd = new FormData();
  if (!args.titulo?.trim()) return { error: 'El título de la tarea no puede estar vacío.' };
  fd.set('title', args.titulo);
  if (args.proyecto_nombre) {
    const project = await findProjectByName(args.proyecto_nombre);
    if (!project) return { error: `No se encontró el proyecto "${args.proyecto_nombre}".` };
    fd.set('projectId', project.id);
  }
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  fd.set('priority', args.prioridad && validPriorities.includes(args.prioridad) ? args.prioridad : 'LOW');
  fd.set('status', 'TODO');
  if (args.fecha) fd.set('dueDate', args.fecha);
  await createTask(fd);
  return { ok: true, mensaje: `Tarea "${args.titulo}" creada.` };
}

async function crearNota(args: { proyecto_nombre: string; titulo: string; contenido: string }) {
  const project = await findProjectByName(args.proyecto_nombre);
  if (!project) return { error: `No se encontró el proyecto "${args.proyecto_nombre}".` };
  const fd = new FormData();
  fd.set('projectId', project.id);
  fd.set('title', args.titulo);
  fd.set('content', args.contenido);
  await createNote(fd);
  return { ok: true, mensaje: `Nota "${args.titulo}" creada en ${project.name}.` };
}

async function completarTarea(args: { titulo: string }) {
  const task = await prisma.tarea.findFirst({ where: { title: { contains: args.titulo } } });
  if (!task) return { error: `No se encontró ninguna tarea con "${args.titulo}" en el título.` };
  const fd = new FormData();
  fd.set('id', task.id);
  fd.set('status', 'DONE');
  await updateTaskStatus(fd);
  return { ok: true, mensaje: `Tarea "${task.title}" marcada como completada.` };
}

async function moverArchivoAProyecto(args: { archivo_titulo: string; proyecto_destino: string }) {
  const archivo = await prisma.archivo.findFirst({ where: { title: { contains: args.archivo_titulo } } });
  if (!archivo) return { error: `No se encontró ningún archivo/nota con "${args.archivo_titulo}" en el título.` };
  const project = await findProjectByName(args.proyecto_destino);
  if (!project) return { error: `No se encontró el proyecto "${args.proyecto_destino}".` };
  await prisma.archivo.update({ where: { id: archivo.id }, data: { projectId: project.id } });
  return { ok: true, mensaje: `"${archivo.title}" movido a ${project.name}.` };
}

export async function executeWriteTool(name: string, args: unknown): Promise<unknown> {
  try {
    switch (name) {
      case 'crear_tarea':
        return await crearTarea(args as { titulo: string; proyecto_nombre?: string; prioridad?: string; fecha?: string });
      case 'crear_nota':
        return await crearNota(args as { proyecto_nombre: string; titulo: string; contenido: string });
      case 'completar_tarea':
        return await completarTarea(args as { titulo: string });
      case 'mover_archivo_a_proyecto':
        return await moverArchivoAProyecto(args as { archivo_titulo: string; proyecto_destino: string });
      default:
        return { error: `Tool de escritura desconocida: ${name}` };
    }
  } catch (error) {
    console.error(`[assistant-tools] Error ejecutando tool de escritura ${name}:`, error);
    return { error: 'Error interno ejecutando la acción.' };
  }
}

export async function executeTool(name: string, args: unknown): Promise<unknown> {
  try {
    switch (name) {
      case 'listar_proyectos':
        return await listarProyectos();
      case 'listar_tareas':
        return await listarTareas(args as { proyecto_nombre?: string; estado?: string });
      case 'buscar_tareas_por_texto':
        return await buscarTareasPorTexto(args as { texto: string });
      case 'leer_nota_contexto':
        return await leerNotaContexto(args as { proyecto_nombre: string });
      default:
        return { error: `Tool desconocida: ${name}` };
    }
  } catch (error) {
    console.error(`[assistant-tools] Error ejecutando ${name}:`, error);
    return { error: 'Error interno ejecutando la consulta.' };
  }
}
