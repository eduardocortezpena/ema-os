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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TEMPLATES_DIR = join(process.cwd(), 'templates');
const PROJECT_FILES_DIR = join(process.cwd(), 'files');

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
