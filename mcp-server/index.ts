/**
 * Servidor MCP local de EMA OS (Fase 6.5)
 *
 * Expone 8 tools: 4 lectura (ejecutan directo) + 4 escritura (requieren
 * confirmación explícita en 2 pasos). Las tools de escritura devuelven una
 * propuesta + confirmationId en el primer llamado; solo un segundo llamado a
 * `confirmar_accion` con ese ID ejecuta la acción real.
 *
 * NO importa nada de Next.js. Accede a Prisma directamente con la misma DB.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PrismaClient } from '../app/lib/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
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
  // ponytail: hard cap — drops oldest if hit (MCP local, misuse not a concern)
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
  PENDING.delete(id); // consumir una sola vez (protección replay)
  if (Date.now() > pending.expiresAt) return null;
  return pending;
}

// --- DB helpers -------------------------------------------------------------

async function findProject(nombre: string) {
  return prisma.proyecto.findFirst({ where: { name: { contains: nombre } } });
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

  await prisma.tarea.create({
    data: {
      title: args.titulo,
      projectId: projectId ?? null,
      priority,
      status: 'TODO',
      dueDate: args.fecha && !isNaN(new Date(args.fecha).getTime()) ? new Date(args.fecha) : undefined,
    },
  });
  return { ok: true, mensaje: `Tarea "${args.titulo}" creada.` };
}

async function execCrearNota(args: { proyecto_nombre: string; titulo: string; contenido: string }) {
  const p = await findProject(args.proyecto_nombre);
  if (!p) return { error: `No se encontró el proyecto "${args.proyecto_nombre}".` };

  // Las notas viven en Archivo (kind=NOTE) desde Sprint 3.3.
  // El archivo físico en Drive/local queda fuera del alcance del MCP por ahora.
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

// id resuelto en el momento de la propuesta — evita ambigüedad por título en el ejecutor
async function execCompletarTarea(args: { id: string; titulo: string }) {
  await prisma.tarea.update({ where: { id: args.id }, data: { status: 'DONE' } });
  return { ok: true, mensaje: `Tarea "${args.titulo}" marcada como completada.` };
}

async function execMoverArchivo(args: { id: string; archivo_titulo: string; proyecto_destino: string }) {
  const p = await findProject(args.proyecto_destino);
  if (!p) return { error: `No se encontró el proyecto "${args.proyecto_destino}".` };
  await prisma.archivo.update({ where: { id: args.id }, data: { projectId: p.id } });
  return { ok: true, mensaje: `"${args.archivo_titulo}" movido a ${p.name}.` };
}

// --- MCP Server -------------------------------------------------------------

const server = new McpServer({
  name: 'ema-os',
  version: '1.0.0',
});

// LECTURA 1: listar_proyectos
server.registerTool(
  'listar_proyectos',
  {
    description: 'Lista TODOS los proyectos del usuario con su estado, prioridad y progreso.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => {
    const projects = await prisma.proyecto.findMany({
      orderBy: { name: 'asc' },
      select: { name: true, status: true, priority: true, progress: true },
    });
    return { content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }] };
  },
);

// LECTURA 2: listar_tareas
server.registerTool(
  'listar_tareas',
  {
    description: 'Lista tareas, opcionalmente filtradas por proyecto y/o estado.',
    inputSchema: {
      proyecto_nombre: z.string().optional().describe('Nombre (o parte) del proyecto.'),
      estado: z.enum(['TODO', 'IN_PROGRESS', 'WAITING', 'DONE']).optional(),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ proyecto_nombre, estado }) => {
    const where: Record<string, unknown> = {};
    if (estado) where.status = estado;
    if (proyecto_nombre) {
      const p = await findProject(proyecto_nombre);
      if (!p) return { content: [{ type: 'text', text: JSON.stringify({ error: `No se encontró proyecto "${proyecto_nombre}".` }) }] };
      where.projectId = p.id;
    }
    const tasks = await prisma.tarea.findMany({
      where,
      select: { title: true, status: true, priority: true, dueDate: true },
      take: 50,
    });
    return { content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }] };
  },
);

// LECTURA 3: buscar_tareas_por_texto
server.registerTool(
  'buscar_tareas_por_texto',
  {
    description: 'Busca tareas cuyo título contenga el texto dado (substring, sin distinción de mayúsculas en ASCII).',
    inputSchema: {
      texto: z.string().describe('Texto a buscar en el título.'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ texto }) => {
    const tasks = await prisma.tarea.findMany({
      where: { title: { contains: texto } },
      select: { title: true, status: true, priority: true, dueDate: true },
      take: 20,
    });
    return { content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }] };
  },
);

// LECTURA 4: leer_nota_contexto
server.registerTool(
  'leer_nota_contexto',
  {
    description: 'Lee las notas de contexto Markdown de un proyecto.',
    inputSchema: {
      proyecto_nombre: z.string().describe('Nombre (o parte) del proyecto.'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ proyecto_nombre }) => {
    const p = await findProject(proyecto_nombre);
    if (!p) return { content: [{ type: 'text', text: JSON.stringify({ error: `No se encontró proyecto "${proyecto_nombre}".` }) }] };

    const notas = await prisma.archivo.findMany({
      where: { projectId: p.id, kind: 'NOTE' },
      select: { title: true, path: true },
    });
    if (notas.length === 0) return { content: [{ type: 'text', text: JSON.stringify({ error: `El proyecto "${p.name}" no tiene notas.` }) }] };

    const results = notas.map((n) => {
      try {
        const contenido = fs.readFileSync(n.path, 'utf-8');
        return { titulo: n.title, contenido };
      } catch {
        return { titulo: n.title, contenido: '(no se pudo leer el archivo)' };
      }
    });
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
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
    const confirmationId = createConfirmation('crear_tarea', args, desc);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ status: 'pending_confirmation', confirmationId, propuesta: desc, instruccion: 'Llama a confirmar_accion con este confirmationId y confirm=true para ejecutar, o confirm=false para cancelar.' }),
      }],
    };
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
    const confirmationId = createConfirmation('crear_nota', args, desc);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ status: 'pending_confirmation', confirmationId, propuesta: desc, instruccion: 'Llama a confirmar_accion con este confirmationId y confirm=true para ejecutar.' }),
      }],
    };
  },
);

// ESCRITURA 3: completar_tarea (2 pasos)
server.registerTool(
  'completar_tarea',
  {
    description: 'Propone marcar una tarea como completada (DONE). Devuelve confirmationId.',
    inputSchema: {
      titulo: z.string().describe('Título (o parte) de la tarea a completar.'),
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
  },
  async (args) => {
    const task = await prisma.tarea.findFirst({ where: { title: { contains: args.titulo } } });
    if (!task) return { content: [{ type: 'text', text: JSON.stringify({ error: `No se encontró tarea con "${args.titulo}".` }) }] };
    const desc = `Marcar como completada la tarea "${task.title}".`;
    // Almacenar id (no solo titulo) para evitar ambiguedad en el ejecutor
    const confirmationId = createConfirmation('completar_tarea', { id: task.id, titulo: task.title }, desc);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ status: 'pending_confirmation', confirmationId, propuesta: desc, instruccion: 'Llama a confirmar_accion con este confirmationId y confirm=true para ejecutar.' }),
      }],
    };
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
    if (!archivo) return { content: [{ type: 'text', text: JSON.stringify({ error: `No se encontró archivo/nota con "${args.archivo_titulo}".` }) }] };
    const desc = `Mover "${archivo.title}" al proyecto "${args.proyecto_destino}".`;
    // Almacenar id resuelto para evitar ambiguedad en el ejecutor
    const confirmationId = createConfirmation('mover_archivo_a_proyecto', { id: archivo.id, archivo_titulo: archivo.title, proyecto_destino: args.proyecto_destino }, desc);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ status: 'pending_confirmation', confirmationId, propuesta: desc, instruccion: 'Llama a confirmar_accion con este confirmationId y confirm=true para ejecutar.' }),
      }],
    };
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
    if (!pending) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'Confirmación expirada, ya usada, o ID inválido.' }) }] };
    }

    if (!confirm) {
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, mensaje: 'Acción cancelada.' }) }] };
    }

    let result: unknown;
    switch (pending.toolName) {
      case 'crear_tarea':
        result = await execCrearTarea(pending.args as Parameters<typeof execCrearTarea>[0]);
        break;
      case 'crear_nota':
        result = await execCrearNota(pending.args as Parameters<typeof execCrearNota>[0]);
        break;
      case 'completar_tarea':
        result = await execCompletarTarea(pending.args as Parameters<typeof execCompletarTarea>[0]);
        break;
      case 'mover_archivo_a_proyecto':
        result = await execMoverArchivo(pending.args as Parameters<typeof execMoverArchivo>[0]);
        break;
      default:
        result = { error: `Tool desconocida: ${pending.toolName}` };
    }

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

// --- Start ------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
// Sin console.log aquí: stdout es el canal MCP, cualquier texto lo rompe.
