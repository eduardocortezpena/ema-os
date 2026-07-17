import { prisma } from './db';
import { getNoteContent } from '@/app/actions/notes';

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
