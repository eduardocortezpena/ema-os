/**
 * Servidor MCP local de EMA OS (Fase 6 — fundación).
 *
 * Expone 14 tools para que agentes externos (Hermes, Claude Code, otros)
 * operen la app sin pasar por la UI:
 *   LECTURA (ejecutan directo):
 *     - listar_proyectos        (filtros estado/prioridad)
 *     - listar_tareas           (filtros proyecto/estado/prioridad)
 *     - buscar_tareas_por_texto
 *     - leer_nota_contexto
 *     - leer_next_actions       (próximas acciones por proyecto)
 *     - leer_my_day             (foco del día: TODO de mayor prioridad)
 *     - listar_plantillas       (DocumentTemplate)
 *   ESCRITURA (2 pasos: devuelven confirmationId; confirmar_accion ejecuta):
 *     - crear_tarea
 *     - actualizar_estado_tarea (TODO/IN_PROGRESS/WAITING/DONE)
 *     - eliminar_tarea
 *     - crear_nota
 *     - mover_archivo_a_proyecto
 *     - generar_documento       (DOCX o PDF desde plantilla Markdown)
 *     - confirmar_accion
 *
 * NO importa nada de Next.js. Accede a Prisma directamente con la misma DB.
 * La generación DOCX reutiliza app/lib/documents.ts (compartido con las
 * Server Actions) para no duplicar docxtemplater.
 *
 * LIMITACIÓN: las tareas creadas/actualizadas vía MCP NO sincronizan Google
 * Calendar (las Server Actions sí lo hacen, pero esa lógica vive acoplada al
 * request context de Next). Es aceptable para agentes; documentado en
 * MCP_SERVER.md.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PrismaClient } from '../app/lib/prisma/client.ts';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { saveDocxForTask, savePdfForTask } from '../app/lib/documents.ts';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';

// --- Prisma setup -----------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Compute absolute file:// URL for the SQLite DB, same pattern as app/lib/db.ts
const rawUrl = process.env.DATABASE_URL ?? 'file:./emaos.db';
const relativePath = rawUrl.replace(/^file:/, '');
const absoluteDbPath = path.isAbsolute(relativePath)
  ? relativePath
  : path.join(__dirname, '..', relativePath.replace(/^\.\//, ''));
const dbUrl = `file:${absoluteDbPath}`;

const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// --- Helpers ----------------------------------------------------------------

async function findProject(nombre: string) {
  return prisma.proyecto.findFirst({ where: { name: { contains: nombre } } });
}

// --- Pending confirmations --------------------------------------------------
// ponytail: Map en memoria, TTL 5 min, mismo patrón que app/api/chat/route.ts
// Cada proceso MCP tiene su propio Map; no comparte estado con Next.js.

interface PendingConfirmation {
  toolName: string;
  args: unknown;
  description: string;
  expiresAt: number;
}

const PENDING: Map<string, PendingConfirmation> = new Map();
const TTL_MS = 5 * 60 * 1000;
const MAX_PENDING = 50;

function purgeExpired() {
  const now = Date.now();
  for (const [k, v] of PENDING) {
    if (now > v.expiresAt) PENDING.delete(k);
  }
}

function createConfirmation(toolName: string, args: unknown, description: string): string {
  purgeExpired();
  if (PENDING.size >= MAX_PENDING) {
    PENDING.delete(PENDING.keys().next().value!);
  }
  const id = crypto.randomUUID();
  PENDING.set(id, { toolName, args, description, expiresAt: Date.now() + TTL_MS });
  return id;
}

function resolveConfirmation(id: string): PendingConfirmation | null {
  purgeExpired();
  const pending = PENDING.get(id);
  if (!pending) return null;
  PENDING.delete(id);
  if (Date.now() > pending.expiresAt) return null;
  return pending;
}

function textResult(obj: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(obj, null, 2) }] };
}

// --- Ejecutores de escritura (llamados SOLO tras confirmación) --------------

async function execCrearTarea(args: {
  titulo: string;
  proyecto_nombre?: string;
  prioridad?: string;
  fecha?: string;
}) {
  if (!args.titulo?.trim()) return { error: 'El título no puede estar vacío.' };

  let projectId: string | undefined;
  if (args.proyecto_nombre) {
    const p = await findProject(args.proyecto_nombre);
    if (!p) return { error: `No se encontró el proyecto "${args.proyecto_nombre}".` };
    projectId = p.id;
  }

  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const priority = args.prioridad && validPriorities.includes(args.prioridad)
    ? (args.prioridad as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')
    : 'LOW';

  const created = await prisma.tarea.create({
    data: {
      title: args.titulo,
      projectId: projectId ?? null,
      priority,
      status: 'TODO',
      dueDate: args.fecha && !isNaN(new Date(args.fecha).getTime()) ? new Date(args.fecha) : undefined,
    },
  });
  return { ok: true, id: created.id, mensaje: `Tarea "${args.titulo}" creada.` };
}

async function execCrearNota(args: { proyecto_nombre: string; titulo: string; contenido: string }) {
  if (!args.titulo?.trim()) return { error: 'El título de la nota no puede estar vacío.' };
  if (!args.contenido?.trim()) return { error: 'El contenido de la nota no puede estar vacío.' };
  const p = await findProject(args.proyecto_nombre);
  if (!p) return { error: `No se encontró el proyecto "${args.proyecto_nombre}".` };

  const notasDir = path.join(__dirname, '..', 'files', p.id);
  fs.mkdirSync(notasDir, { recursive: true });
  const fileName = `${Date.now()}-${args.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
  const filePath = path.join(notasDir, fileName);
  fs.writeFileSync(filePath, `# ${args.titulo}\n\n${args.contenido}`, 'utf-8');

  await prisma.archivo.create({
    data: {
      projectId: p.id,
      kind: 'NOTE',
      title: args.titulo,
      path: filePath,
      mimeType: 'text/markdown',
    },
  });
  return { ok: true, mensaje: `Nota "${args.titulo}" creada en ${p.name}.` };
}

async function execActualizarEstado(args: { id: string; titulo: string; estado: 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE' }) {
  // Validar existencia antes del update: sin esto, un id inexistente (ej. tarea
  // borrada entre propuesta y confirmación) lanza P2025 y crashea el server.
  const exists = await prisma.tarea.findUnique({ where: { id: args.id }, select: { id: true } });
  if (!exists) return { error: `La tarea "${args.titulo}" ya no existe (id ${args.id}).` };
  await prisma.tarea.update({ where: { id: args.id }, data: { status: args.estado } });
  return { ok: true, mensaje: `Tarea "${args.titulo}" → ${args.estado}.` };
}

async function execEliminarTarea(args: { id: string; titulo: string }) {
  const exists = await prisma.tarea.findUnique({ where: { id: args.id }, select: { id: true } });
  if (!exists) return { error: `La tarea "${args.titulo}" ya no existe (id ${args.id}).` };
  await prisma.tarea.delete({ where: { id: args.id } });
  return { ok: true, mensaje: `Tarea "${args.titulo}" eliminada.` };
}

async function execMoverArchivo(args: { id: string; archivo_titulo: string; proyecto_destino: string }) {
  const exists = await prisma.archivo.findUnique({ where: { id: args.id }, select: { id: true } });
  if (!exists) return { error: `El archivo "${args.archivo_titulo}" ya no existe (id ${args.id}).` };
  const p = await findProject(args.proyecto_destino);
  if (!p) return { error: `No se encontró el proyecto "${args.proyecto_destino}".` };
  await prisma.archivo.update({ where: { id: args.id }, data: { projectId: p.id } });
  return { ok: true, mensaje: `"${args.archivo_titulo}" movido a ${p.name}.` };
}

async function execGenerarDocumento(args: {
  tarea_id: string;
  plantilla_id: string;
  data?: Record<string, string>;
}) {
  const template = await prisma.documentTemplate.findUnique({ where: { id: args.plantilla_id } });
  if (!template) return { error: `No se encontró la plantilla "${args.plantilla_id}".` };
  const save = template.docType === 'md' ? savePdfForTask : saveDocxForTask;
  const result = await save(prisma, args.tarea_id, args.plantilla_id, args.data ?? {});
  if (!result.success) return { error: result.error };
  return { ok: true, filePath: result.filePath, mensaje: `Documento ${template.docType.toUpperCase()} generado y guardado.` };
}

// --- MCP Server -------------------------------------------------------------

const server = new McpServer({
  name: 'ema-os',
  version: '1.0.0',
});

// LECTURA 1: listar_proyectos (con filtros estado/prioridad)
server.registerTool(
  'listar_proyectos',
  {
    description: 'Lista proyectos con estado, prioridad y progreso. Opcionalmente filtra por estado y/o prioridad.',
    inputSchema: {
      estado: z.enum(['PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED']).optional().describe('Filtrar por estado.'),
      prioridad: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().describe('Filtrar por prioridad.'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ estado, prioridad }) => {
    const projects = await prisma.proyecto.findMany({
      where: { status: estado, priority: prioridad },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, status: true, priority: true, progress: true },
    });
    return textResult(projects);
  },
);

// LECTURA 2: listar_tareas (con filtros proyecto/estado/prioridad)
server.registerTool(
  'listar_tareas',
  {
    description: 'Lista tareas, opcionalmente filtradas por proyecto, estado y/o prioridad.',
    inputSchema: {
      proyecto_nombre: z.string().optional().describe('Nombre (o parte) del proyecto.'),
      estado: z.enum(['TODO', 'IN_PROGRESS', 'WAITING', 'DONE']).optional(),
      prioridad: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ proyecto_nombre, estado, prioridad }) => {
    const where: Record<string, unknown> = {};
    if (estado) where.status = estado;
    if (prioridad) where.priority = prioridad;
    if (proyecto_nombre) {
      const p = await findProject(proyecto_nombre);
      if (!p) return textResult({ error: `No se encontró proyecto "${proyecto_nombre}".` });
      where.projectId = p.id;
    }
    const tasks = await prisma.tarea.findMany({
      where,
      select: { id: true, title: true, status: true, priority: true, dueDate: true, projectId: true },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
    return textResult(tasks);
  },
);

// LECTURA 3: buscar_tareas_por_texto
server.registerTool(
  'buscar_tareas_por_texto',
  {
    description: 'Busca tareas cuyo título contenga el texto dado.',
    inputSchema: { texto: z.string().describe('Texto a buscar en el título.') },
    annotations: { readOnlyHint: true },
  },
  async ({ texto }) => {
    const tasks = await prisma.tarea.findMany({
      where: { title: { contains: texto } },
      select: { id: true, title: true, status: true, priority: true, dueDate: true },
      take: 20,
    });
    return textResult(tasks);
  },
);

// LECTURA 4: leer_nota_contexto
server.registerTool(
  'leer_nota_contexto',
  {
    description: 'Lee las notas de contexto Markdown de un proyecto.',
    inputSchema: { proyecto_nombre: z.string().describe('Nombre (o parte) del proyecto.') },
    annotations: { readOnlyHint: true },
  },
  async ({ proyecto_nombre }) => {
    const p = await findProject(proyecto_nombre);
    if (!p) return textResult({ error: `No se encontró proyecto "${proyecto_nombre}".` });

    const notas = await prisma.archivo.findMany({
      where: { projectId: p.id, kind: 'NOTE' },
      select: { title: true, path: true },
    });
    if (notas.length === 0) return textResult({ error: `El proyecto "${p.name}" no tiene notas.` });

    const results = notas.map((n) => {
      try {
        return { titulo: n.title, contenido: fs.readFileSync(n.path, 'utf-8') };
      } catch {
        return { titulo: n.title, contenido: '(no se pudo leer el archivo)' };
      }
    });
    return textResult(results);
  },
);

// LECTURA 5: leer_next_actions
server.registerTool(
  'leer_next_actions',
  {
    description: 'Lista la próxima acción (Next Action) de cada proyecto: texto y/o tarea asignada.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => {
    const projects = await prisma.proyecto.findMany({
      where: { status: { not: 'COMPLETED' } },
      select: {
        name: true,
        status: true,
        nextAction: true,
        nextActionTask: { select: { id: true, title: true, status: true } },
      },
      orderBy: { name: 'asc' },
    });
    const conNext = projects
      .filter((p) => p.nextAction || p.nextActionTask)
      .map((p) => ({
        proyecto: p.name,
        status: p.status,
        nextAction: p.nextAction ?? null,
        nextActionTask: p.nextActionTask ? { id: p.nextActionTask.id, title: p.nextActionTask.title, status: p.nextActionTask.status } : null,
      }));
    return textResult(conNext);
  },
);

// LECTURA 6: leer_my_day — tras eliminar la vista "My Day" (UX tareas v2),
// esta tool devuelve el foco del día: las tareas TODO de mayor prioridad
// (mismo criterio con el que el dashboard ordena "Siguientes acciones"). Se
// conserva el nombre para no romper configuraciones existentes de Hermes.
server.registerTool(
  'leer_my_day',
  {
    description: 'Devuelve las tareas TODO de mayor prioridad (foco del día). "My Day" fue eliminado; el dashboard ordena las siguientes acciones por prioridad.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => {
    const tareas = await prisma.tarea.findMany({
      where: { status: 'TODO' },
      include: { project: { select: { name: true } } },
    });
    // ponytail: sort por prioridad inlineado (mismos pesos que app/lib/sort.ts)
    // — orderBy de Prisma no sirve: el enum Priority ordena alfabético en
    // SQLite (CRITICAL < HIGH < LOW < MEDIUM, incorrecto). Desempate por dueDate.
    const ORDEN: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    tareas.sort((a, b) => {
      const pd = (ORDEN[a.priority] ?? 99) - (ORDEN[b.priority] ?? 99);
      if (pd !== 0) return pd;
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
    return textResult({ tareas: tareas.slice(0, 10) });
  },
);

// LECTURA 7: listar_plantillas
server.registerTool(
  'listar_plantillas',
  {
    description: 'Lista las plantillas de documento (DocumentTemplate), opcionalmente por tipo.',
    inputSchema: {
      tipo: z.enum(['docx', 'md']).optional().describe('Filtrar por tipo de plantilla.'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ tipo }) => {
    const templates = await prisma.documentTemplate.findMany({
      where: tipo ? { docType: tipo } : undefined,
      select: { id: true, name: true, docType: true, variables: true, project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return textResult(templates);
  },
);

// ESCRITURA 1: crear_tarea (2 pasos)
server.registerTool(
  'crear_tarea',
  {
    description: 'Propone crear una tarea nueva. Devuelve un confirmationId; usa confirmar_accion para ejecutar.',
    inputSchema: {
      titulo: z.string().describe('Título de la tarea.'),
      proyecto_nombre: z.string().optional().describe('Proyecto al que pertenece. Omitir para Inbox.'),
      prioridad: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      fecha: z.string().optional().describe('Fecha límite YYYY-MM-DD.'),
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
  },
  async (args) => {
    const desc = `Crear tarea "${args.titulo}"${args.proyecto_nombre ? ` en proyecto "${args.proyecto_nombre}"` : ' (Inbox)'}${args.prioridad ? `, prioridad ${args.prioridad}` : ''}${args.fecha ? `, fecha ${args.fecha}` : ''}.`;
    return textResult({
      status: 'pending_confirmation',
      confirmationId: createConfirmation('crear_tarea', args, desc),
      propuesta: desc,
      instruccion: 'Llama a confirmar_accion con este confirmationId y confirm=true para ejecutar, o false para cancelar.',
    });
  },
);

// ESCRITURA 2: crear_nota (2 pasos)
server.registerTool(
  'crear_nota',
  {
    description: 'Propone crear una nota de contexto Markdown para un proyecto. Devuelve confirmationId.',
    inputSchema: {
      proyecto_nombre: z.string(),
      titulo: z.string(),
      contenido: z.string(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
  },
  async (args) => {
    const desc = `Crear nota "${args.titulo}" en proyecto "${args.proyecto_nombre}".`;
    return textResult({
      status: 'pending_confirmation',
      confirmationId: createConfirmation('crear_nota', args, desc),
      propuesta: desc,
      instruccion: 'Llama a confirmar_accion con este confirmationId y confirm=true para ejecutar.',
    });
  },
);

// ESCRITURA 3: actualizar_estado_tarea (2 pasos) — TODO/DONE (+ IN_PROGRESS/WAITING)
server.registerTool(
  'actualizar_estado_tarea',
  {
    description: 'Propone cambiar el estado de una tarea (TODO/IN_PROGRESS/WAITING/DONE). Devuelve confirmationId.',
    inputSchema: {
      titulo: z.string().describe('Título (o parte) de la tarea.'),
      estado: z.enum(['TODO', 'IN_PROGRESS', 'WAITING', 'DONE']).describe('Nuevo estado.'),
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
  },
  async (args) => {
    const task = await prisma.tarea.findFirst({ where: { title: { contains: args.titulo } } });
    if (!task) return textResult({ error: `No se encontró tarea con "${args.titulo}".` });
    const desc = `Cambiar tarea "${task.title}" (estado actual ${task.status}) → ${args.estado}.`;
    return textResult({
      status: 'pending_confirmation',
      confirmationId: createConfirmation('actualizar_estado_tarea', { id: task.id, titulo: task.title, estado: args.estado }, desc),
      propuesta: desc,
      instruccion: 'Llama a confirmar_accion con este confirmationId y confirm=true para ejecutar.',
    });
  },
);

// ESCRITURA 3.5: eliminar_tarea (2 pasos)
server.registerTool(
  'eliminar_tarea',
  {
    description: 'Propone eliminar una tarea. Devuelve un confirmationId; usa confirmar_accion para ejecutar.',
    inputSchema: {
      titulo: z.string().describe('Título (o parte) de la tarea a eliminar.'),
    },
    annotations: { readOnlyHint: false, destructiveHint: true },
  },
  async (args) => {
    const task = await prisma.tarea.findFirst({ where: { title: { contains: args.titulo } } });
    if (!task) return textResult({ error: `No se encontró tarea con "${args.titulo}".` });
    const desc = `Eliminar tarea "${task.title}".`;
    return textResult({
      status: 'pending_confirmation',
      confirmationId: createConfirmation('eliminar_tarea', { id: task.id, titulo: task.title }, desc),
      propuesta: desc,
      instruccion: 'Llama a confirmar_accion con este confirmationId y confirm=true para ejecutar.',
    });
  },
);

// ESCRITURA 4: mover_archivo_a_proyecto (2 pasos)
server.registerTool(
  'mover_archivo_a_proyecto',
  {
    description: 'Propone mover un archivo/nota a otro proyecto. Devuelve confirmationId.',
    inputSchema: {
      archivo_titulo: z.string(),
      proyecto_destino: z.string(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
  },
  async (args) => {
    const archivo = await prisma.archivo.findFirst({ where: { title: { contains: args.archivo_titulo } } });
    if (!archivo) return textResult({ error: `No se encontró archivo/nota con "${args.archivo_titulo}".` });
    const desc = `Mover "${archivo.title}" al proyecto "${args.proyecto_destino}".`;
    return textResult({
      status: 'pending_confirmation',
      confirmationId: createConfirmation('mover_archivo_a_proyecto', { id: archivo.id, archivo_titulo: archivo.title, proyecto_destino: args.proyecto_destino }, desc),
      propuesta: desc,
      instruccion: 'Llama a confirmar_accion con este confirmationId y confirm=true para ejecutar.',
    });
  },
);

// ESCRITURA 5: generar_documento (2 pasos, DOCX/PDF)
server.registerTool(
  'generar_documento',
  {
    description: 'Propone generar un documento DOCX o PDF (plantilla Markdown) asociado a una tarea. Devuelve confirmationId.',
    inputSchema: {
      tarea_id: z.string().describe('ID de la tarea (obtenlo con listar_tareas).'),
      plantilla_id: z.string().describe('ID de una plantilla DOCX (obtenlo con listar_plantillas).'),
      data: z.record(z.string(), z.string()).optional().describe('Variables {campo: valor} para rellenar la plantilla.'),
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
  },
  async (args) => {
    const template = await prisma.documentTemplate.findUnique({ where: { id: args.plantilla_id } });
    if (!template) return textResult({ error: `No se encontró la plantilla "${args.plantilla_id}".` });
    if (template.docType !== 'docx' && template.docType !== 'md') {
      return textResult({ error: `La plantilla "${template.name}" no es DOCX ni Markdown (es ${template.docType}).` });
    }
    const desc = `Generar documento ${template.docType.toUpperCase()} "${template.name}" para la tarea ${args.tarea_id}.`;
    return textResult({
      status: 'pending_confirmation',
      confirmationId: createConfirmation('generar_documento', args, desc),
      propuesta: desc,
      instruccion: 'Llama a confirmar_accion con este confirmationId y confirm=true para ejecutar.',
    });
  },
);

// CONFIRMACIÓN: confirmar_accion
server.registerTool(
  'confirmar_accion',
  {
    description: 'Confirma o cancela una acción de escritura pendiente. Usa el confirmationId devuelto por una tool de escritura.',
    inputSchema: {
      confirmationId: z.string().describe('ID de la confirmación pendiente.'),
      confirm: z.boolean().describe('true = ejecutar la acción, false = cancelar.'),
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
  },
  async ({ confirmationId, confirm }) => {
    const pending = resolveConfirmation(confirmationId);
    if (!pending) return textResult({ error: 'Confirmación expirada, ya usada, o ID inválido.' });

    if (!confirm) return textResult({ ok: true, mensaje: 'Acción cancelada.' });

    let result: unknown;
    try {
      switch (pending.toolName) {
        case 'crear_tarea':
          result = await execCrearTarea(pending.args as Parameters<typeof execCrearTarea>[0]);
          break;
        case 'crear_nota':
          result = await execCrearNota(pending.args as Parameters<typeof execCrearNota>[0]);
          break;
        case 'actualizar_estado_tarea':
          result = await execActualizarEstado(pending.args as Parameters<typeof execActualizarEstado>[0]);
          break;
        case 'eliminar_tarea':
          result = await execEliminarTarea(pending.args as Parameters<typeof execEliminarTarea>[0]);
          break;
        case 'mover_archivo_a_proyecto':
          result = await execMoverArchivo(pending.args as Parameters<typeof execMoverArchivo>[0]);
          break;
        case 'generar_documento':
          result = await execGenerarDocumento(pending.args as Parameters<typeof execGenerarDocumento>[0]);
          break;
        default:
          result = { error: `Tool desconocida: ${pending.toolName}` };
      }
    } catch (error) {
      // Endurecimiento: nunca crashear el server por un error de ejecución;
      // devolver siempre un error estructurado.
      result = { error: `Error ejecutando ${pending.toolName}: ${error instanceof Error ? error.message : String(error)}` };
    }

    return textResult(result);
  },
);

// --- Start ------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
