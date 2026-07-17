import fs from 'node:fs';
import path from 'node:path';
import { prisma } from './db';

// Sprint 6.2: construcción del system prompt del asistente. Módulo separado
// (no inline en route.ts) porque Sprint 6.3/6.4 (tool-use) van a reusar esta
// misma base de contexto — evita duplicar la lectura de MASTER_CONTEXT.md +
// el resumen de Prisma en cada lugar que lo necesite (architect).
//
// Nota de prompt caching (pedido en Sprint 6.2): OpenRouter soporta
// `cache_control` (formato Anthropic) solo para proveedores que lo
// implementan nativamente. El modelo por defecto (`openrouter/free`) es un
// auto-router no determinístico entre proveedores variados, y el fallback
// (`openai/gpt-4o-mini`) tampoco lo soporta — ningún modelo real en uso hoy
// lo consumiría. Escribir `cache_control` sería funcionalidad fantasma no
// verificable (regla dura de CLAUDE.md/AGENTS.md: nada sin verificar en
// real). NO implementado a propósito — revisar si en el futuro se fija un
// modelo Anthropic como default.

const MASTER_CONTEXT_PATH = path.join(process.cwd(), 'MASTER_CONTEXT.md');

function readMasterContext(): string {
  try {
    return fs.readFileSync(MASTER_CONTEXT_PATH, 'utf-8');
  } catch (error) {
    console.error('[assistant-context] No se pudo leer MASTER_CONTEXT.md:', error);
    return '';
  }
}

// Resumen acotado a propósito (architect + Fase 1: "¿qué hago ahora?"):
// proyectos ACTIVE + su next action + títulos de tareas abiertas, sin
// descripciones largas. Sin prompt caching real, cada mensaje del chat paga
// este contexto completo — mantenerlo chico es la optimización real
// disponible hoy, no cache_control.
async function buildProjectSummary(): Promise<string> {
  const projects = await prisma.proyecto.findMany({
    where: { status: 'ACTIVE' },
    include: {
      nextActionTask: { select: { title: true } },
      tasks: {
        where: { status: { not: 'DONE' } },
        select: { title: true, priority: true, dueDate: true },
      },
    },
    orderBy: { priority: 'desc' },
  });

  if (projects.length === 0) return 'No hay proyectos activos registrados.';

  const lines = projects.map((p) => {
    const nextAction = p.nextActionTask ? `Next action: ${p.nextActionTask.title}` : 'Sin next action';
    const openTasks = p.tasks
      .map((t) => `${t.title} [${t.priority}]${t.dueDate ? ` (vence ${t.dueDate.toISOString().slice(0, 10)})` : ''}`)
      .join('; ');
    return `- ${p.name} (prioridad ${p.priority}, ${p.progress}%). ${nextAction}. Tareas abiertas: ${openTasks || 'ninguna'}.`;
  });

  return lines.join('\n');
}

export async function buildSystemPrompt(): Promise<string> {
  const masterContext = readMasterContext();
  const projectSummary = await buildProjectSummary();

  return [
    'Eres el asistente de EMA OS, el organizador personal de proyectos de Eduardo. Responde en español, de forma directa y concreta.',
    '',
    '## Contexto del proyecto (MASTER_CONTEXT.md)',
    masterContext || '(no disponible)',
    '',
    '## Estado actual de proyectos y tareas (datos en vivo)',
    projectSummary,
    '',
    'Usa este contexto para responder con precisión sobre los proyectos reales del usuario. Si no tienes datos suficientes para responder algo, dilo en vez de inventar.',
  ].join('\n');
}
