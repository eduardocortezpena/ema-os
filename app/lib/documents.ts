/**
 * Lógica de generación de documentos compartida entre las Server Actions
 * (Next) y el servidor MCP (Node puro). Reutilizable para NO duplicar
 * docxtemplater/PizZip.
 *
 * `prisma` se recibe por parámetro (inyección) para evitar instanciar otro
 * cliente y para desacoplar el módulo del proceso que lo aloja (Next usa el
 * singleton de app/lib/db.ts; el MCP instancia el suyo). PrismaClient se
 * importa solo como tipo (`import type`) → se elimina en runtime, así el
 * módulo es importable tanto desde Next (bundler) como desde Node (ESM).
 */

import type { PrismaClient } from './prisma/client';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const TEMPLATES_DIR = join(process.cwd(), 'templates');
const PROJECT_FILES_DIR = join(process.cwd(), 'files');

// --- Chrome para puppeteer (md-to-pdf) --------------------------------------
// puppeteer (que usa md-to-pdf por dentro) necesita un Chrome. Reutilizamos el
// de Playwright si está instalado y nadie fijó PUPPETEER_EXECUTABLE_PATH.
// Centralizado aquí para servir igual al Server Action (Next) y al MCP (Node).
function resolveChromium(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const root = process.platform === 'win32'
    ? join(homedir(), 'AppData', 'Local', 'ms-playwright')
    : join(homedir(), '.cache', 'ms-playwright');
  if (!existsSync(root)) return undefined;
  try {
    for (const dir of readdirSync(root)) {
      if (!dir.startsWith('chromium-')) continue;
      for (const sub of ['chrome-win64', 'chrome-win', 'chrome-linux', 'chrome-mac']) {
        const bin = process.platform === 'win32' ? 'chrome.exe' : 'chrome';
        const candidate = join(root, dir, sub, bin);
        if (existsSync(candidate)) return candidate;
      }
    }
  } catch { /* best-effort */ }
  return undefined;
}

function ensureTemplatesDir() {
  if (!existsSync(TEMPLATES_DIR)) mkdirSync(TEMPLATES_DIR, { recursive: true });
}

/**
 * Genera un .docx a partir de una plantilla docx y datos.
 * Devuelve { buf } en éxito o { error } en fallo (mismo contrato que la
 * Server Action original).
 */
export async function generateDocxFromTemplate(
  prisma: PrismaClient,
  templateId: string,
  data: Record<string, unknown>,
): Promise<{ buf?: Buffer; error?: string }> {
  try {
    ensureTemplatesDir();
    const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
    if (!template) return { error: 'Plantilla no encontrada' };
    if (template.docType !== 'docx') return { error: 'La plantilla no es de tipo docx' };

    const filePath = join(TEMPLATES_DIR, template.path);
    if (!existsSync(filePath)) return { error: 'Archivo de plantilla no encontrado en disco' };

    const content = readFileSync(filePath);
    const doc = new Docxtemplater(new PizZip(content), { paragraphLoop: true, linebreaks: true });
    doc.setData(data);
    doc.render();
    return { buf: doc.getZip().generate({ type: 'nodebuffer' }) };
  } catch (error) {
    console.error('[documents] generateDocxFromTemplate error:', error);
    return { error: error instanceof Error ? error.message : 'Error generando el documento.' };
  }
}

/**
 * Genera un .docx desde la plantilla y lo guarda en la carpeta del proyecto
 * de la tarea, registrándolo como Archivo. Cubre el flujo DOCX de
 * generateDocumentFromTask (la rama PDF vive en document-actions.ts con su
 * bug preexistente de puppeteer, fuera de este módulo).
 */
export async function saveDocxForTask(
  prisma: PrismaClient,
  taskId: string,
  templateId: string,
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string; filePath?: string }> {
  const task = await prisma.tarea.findUnique({ where: { id: taskId }, include: { project: true } });
  if (!task) return { success: false, error: 'Tarea no encontrada' };
  if (!task.projectId) return { success: false, error: 'La tarea no tiene proyecto asignado' };

  const generated = await generateDocxFromTemplate(prisma, templateId, data);
  if (!generated.buf) return { success: false, error: generated.error };

  const projectDir = join(PROJECT_FILES_DIR, task.projectId);
  if (!existsSync(projectDir)) mkdirSync(projectDir, { recursive: true });

  const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
  const fileName = `${Date.now()}_${task.title.replace(/\s+/g, '_').toLowerCase()}.docx`;
  const filePath = join(projectDir, fileName);
  writeFileSync(filePath, generated.buf);

  await prisma.archivo.create({
    data: {
      projectId: task.projectId,
      kind: 'FILE',
      title: `${task.title} - ${template?.name ?? 'documento'}`,
      path: `files/${task.projectId}/${fileName}`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  });

  return { success: true, filePath };
}

/**
 * Genera un .pdf a partir de una plantilla Markdown usando md-to-pdf (puppeteer).
 * Devuelve { buf } en éxito o { error } en fallo. Compartido con el MCP para no
 * duplicar la lógica de Chrome.
 *
 * Nota histórica: antes esto vivía solo en document-actions.ts y fallaba en el
 * bundle de Next con `puppeteer_1.default.launch is not a function`. Causa raíz:
 * Next bundleaba md-to-pdf/puppeteer y su interop CJS sintético rompía el
 * `.default.launch`. Fix: serverExternalPackages en next.config.ts + esta
 * función única. En Node puro (MCP) md-to-pdf funciona sin más (verificado).
 */
export async function generatePdfFromMarkdown(
  prisma: PrismaClient,
  templateId: string,
  data: Record<string, unknown>,
): Promise<{ buf?: Buffer; error?: string }> {
  try {
    const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
    if (!template) return { error: 'Plantilla no encontrada' };
    if (template.docType !== 'md') return { error: 'La plantilla no es de tipo Markdown' };

    const filePath = join(TEMPLATES_DIR, template.path);
    if (!existsSync(filePath)) return { error: 'Archivo de plantilla no encontrado en disco' };

    let content = readFileSync(filePath, 'utf8');
    if (data && Object.keys(data).length > 0) {
      for (const [key, value] of Object.entries(data)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? ''));
      }
    }

    const chromium = resolveChromium();
    if (chromium) process.env.PUPPETEER_EXECUTABLE_PATH = chromium;

    const { mdToPdf } = await import('md-to-pdf');
    const pdf = await mdToPdf({ content }, {});
    if (!pdf || !pdf.content) return { error: 'No se pudo generar el PDF' };
    return { buf: pdf.content };
  } catch (error) {
    console.error('[documents] generatePdfFromMarkdown error:', error);
    return { error: error instanceof Error ? error.message : 'Error generando el PDF.' };
  }
}

/**
 * Genera un .pdf desde la plantilla Markdown y lo guarda en la carpeta del
 * proyecto de la tarea, registrándolo como Archivo. Espejo PDF de
 * saveDocxForTask.
 */
export async function savePdfForTask(
  prisma: PrismaClient,
  taskId: string,
  templateId: string,
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string; filePath?: string }> {
  const task = await prisma.tarea.findUnique({ where: { id: taskId }, include: { project: true } });
  if (!task) return { success: false, error: 'Tarea no encontrada' };
  if (!task.projectId) return { success: false, error: 'La tarea no tiene proyecto asignado' };

  const generated = await generatePdfFromMarkdown(prisma, templateId, data);
  if (!generated.buf) return { success: false, error: generated.error };

  const projectDir = join(PROJECT_FILES_DIR, task.projectId);
  if (!existsSync(projectDir)) mkdirSync(projectDir, { recursive: true });

  const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
  const fileName = `${Date.now()}_${task.title.replace(/\s+/g, '_').toLowerCase()}.pdf`;
  const filePath = join(projectDir, fileName);
  writeFileSync(filePath, generated.buf);

  await prisma.archivo.create({
    data: {
      projectId: task.projectId,
      kind: 'FILE',
      title: `${task.title} - ${template?.name ?? 'documento'}`,
      path: `files/${task.projectId}/${fileName}`,
      mimeType: 'application/pdf',
    },
  });

  return { success: true, filePath };
}
