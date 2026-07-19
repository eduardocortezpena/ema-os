'use server';

import { prisma } from '@/app/lib/db';
import {
  generateDocxFromTemplate as libGenerateDocx,
  generatePdfFromMarkdown as libGeneratePdf,
  saveDocxForTask,
  savePdfForTask,
} from '@/app/lib/documents';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { redirect } from 'next/navigation';
import { toUserMessage } from '@/app/lib/errors';

// Directorio base para plantillas
const TEMPLATES_DIR = join(process.cwd(), 'templates');

// Asegurar que existe el directorio de plantillas
function ensureTemplatesDir() {
  if (!existsSync(TEMPLATES_DIR)) {
    mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
}

/**
 * Registra una plantilla de documento en el sistema.
 * @param formData - Contiene name, docType, y el archivo de plantilla
 */
export async function registerDocumentTemplate(formData: FormData): Promise<void> {
  // returnTo permite que el formulario viva en cualquier página (originalmente
  // /settings, ahora /templates). Si no se especifica, se redirige a /templates.
  const returnTo = formData.get('returnTo')?.toString() || '/templates';
  const errorBase = `${returnTo}${returnTo.includes('?') ? '&' : '?'}error=`;

  try {
    ensureTemplatesDir();

    const name = formData.get('name')?.toString().trim();
    const docType = formData.get('docType')?.toString().trim();
    const projectId = formData.get('projectId')?.toString() || null;

    if (!name || !docType) {
      redirect(`${errorBase}${encodeURIComponent('Nombre y tipo de documento son requeridos')}`);
    }

    const file = formData.get('template') as File;
    if (!file || file.size === 0) {
      redirect(`${errorBase}${encodeURIComponent('Archivo de plantilla requerido')}`);
    }

    // Guardar archivo en ./templates/
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileExt = docType === 'docx' ? '.docx' : '.md';
    const fileName = `${Date.now()}_${name.replace(/\s+/g, '_').toLowerCase()}${fileExt}`;
    const filePath = join(TEMPLATES_DIR, fileName);

    writeFileSync(filePath, buffer);

    await prisma.documentTemplate.create({
      data: {
        name,
        docType,
        path: fileName,
        projectId: projectId || null,
      },
    });

    redirect(`${returnTo}?created=1`);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[document-actions] registerDocumentTemplate error:', error);
    redirect(`${errorBase}${encodeURIComponent(toUserMessage(error, 'Error registrando la plantilla. Intenta de nuevo.'))}`);
  }
}

/**
 * Genera un documento .docx a partir de una plantilla y datos proporcionados.
 * Deliega en app/lib/documents.ts (compartido con el MCP server).
 * @param templateId - ID de la plantilla en la base de datos
 * @param data - Objeto con los datos para rellenar la plantilla
 */
export async function generateDocxFromTemplate(
  templateId: string,
  data: Record<string, unknown>
): Promise<{ buf?: Buffer; error?: string }> {
  return libGenerateDocx(prisma, templateId, data);
}

/**
 * Genera un PDF desde una plantilla Markdown. Delega en app/lib/documents.ts
 * (compartido con el MCP server). El motor (md-to-pdf/puppeteer) y la
 * resolución del Chrome viven ahí.
 */
export async function generatePdfFromMarkdown(
  templateId: string,
  data?: Record<string, unknown>
): Promise<{ buf?: Buffer; error?: string }> {
  return libGeneratePdf(prisma, templateId, data ?? {});
}

/**
 * Genera un documento desde una plantilla y lo guarda en la carpeta del proyecto.
 * La rama DOCX delega en app/lib/documents.ts (saveDocxForTask); la rama PDF
 * mantiene su bug preexistente de puppeteer.
 * @param taskId - ID de la tarea
 * @param templateId - ID de la plantilla
 * @param data - Datos para rellenar la plantilla
 */
export async function generateDocumentFromTask(
  taskId: string,
  templateId: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string; filePath?: string }> {
  try {
    const template = await prisma.documentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) return { success: false, error: 'Plantilla no encontrada' };

    // DOCX y PDF delegan a la lógica compartida (generar + guardar + registrar).
    if (template.docType === 'docx') return saveDocxForTask(prisma, taskId, templateId, data);
    if (template.docType === 'md') return savePdfForTask(prisma, taskId, templateId, data);
    return { success: false, error: `Tipo de plantilla no soportado: ${template.docType}` };
  } catch (error) {
    console.error('[document-actions] generateDocumentFromTask error:', error);
    return { success: false, error: toUserMessage(error, 'Error generando el documento desde la tarea.') };
  }
}

/**
 * Genera un documento desde una plantilla y marca la tarea como completada.
 * @param taskId - ID de la tarea
 * @param templateId - ID de la plantilla
 * @param data - Datos para rellenar la plantilla
 */
export async function generateDocumentAndCompleteTask(
  taskId: string,
  templateId: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string; filePath?: string }> {
  // Generar el documento primero
  const result = await generateDocumentFromTask(taskId, templateId, data);

  if (!result.success) {
    return result;
  }

  // Marcar la tarea como completada
  try {
    await prisma.tarea.update({
      where: { id: taskId },
      data: { status: 'DONE', plannedFor: null },
    });
  } catch (error) {
    console.error('[document-actions] Error marcando tarea completada:', error);
    // No fallamos el request principal, solo loggeamos
  }

  return result;
}

/**
 * Elimina una plantilla de documento: borra el registro en la BD y el
 * archivo físico en ./templates/. Si el archivo ya no existe en disco (ej.
 * migración manual, borrado parcial previo), lo ignora y solo borra el
 * registro — la BD es la fuente de verdad de lo que el usuario ve.
 * @param formData - Contiene id (de la plantilla) y returnTo opcional
 */
export async function deleteDocumentTemplate(formData: FormData): Promise<void> {
  const id = formData.get('id')?.toString();
  const returnTo = formData.get('returnTo')?.toString() || '/templates';
  const errorBase = `${returnTo}${returnTo.includes('?') ? '&' : '?'}error=`;

  if (!id) {
    redirect(`${errorBase}${encodeURIComponent('ID de plantilla requerido')}`);
  }

  try {
    const template = await prisma.documentTemplate.findUnique({
      where: { id },
      select: { path: true },
    });

    if (!template) {
      // Ya no existe — tratamos como éxito idempotente.
      redirect(returnTo);
    }

    // Borrar archivo físico si sigue en disco. try/catch interno: que la
    // ausencia del archivo no impida borrar el registro huérfano.
    const filePath = join(TEMPLATES_DIR, template.path);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch (unlinkError) {
        console.error('[document-actions] No se pudo borrar el archivo físico:', unlinkError);
      }
    }

    await prisma.documentTemplate.delete({ where: { id } });
    redirect(returnTo);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[document-actions] deleteDocumentTemplate error:', error);
    redirect(`${errorBase}${encodeURIComponent(toUserMessage(error, 'Error eliminando la plantilla. Intenta de nuevo.'))}`);
  }
}
