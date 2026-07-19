'use server';

import { prisma } from '@/app/lib/db';
import { generateDocxFromTemplate as libGenerateDocx, saveDocxForTask } from '@/app/lib/documents';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { redirect } from 'next/navigation';
import { toUserMessage } from '@/app/lib/errors';

// Configuración de puppeteer para usar Chrome de Playwright existente.
// NOTA: la generación PDF (md→pdf) tiene un bug preexistente
// (puppeteer_1.default.launch is not a function) — no arreglado, fuera de
// alcance de la Fase 6 MCP. Solo se mantiene para no romper la UI existente.
process.env.PUPPETEER_EXECUTABLE_PATH =
  'C:\\Users\\EdEma\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe';

// Directorio base para plantillas
const TEMPLATES_DIR = join(process.cwd(), 'templates');
const PROJECT_FILES_DIR = join(process.cwd(), 'files');

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
 * Genera un PDF desde una plantilla Markdown usando md-to-pdf.
 * Configurado para usar Chrome existente de Playwright.
 *
 * BUG PREEXISTENTE (no arreglado en Fase 6): puppeteer falla al lanzar
 * (`puppeteer_1.default.launch is not a function`). La generación PDF está
 * rota en main; no introducida por el trabajo MCP. Se mantiene el código para
 * no alterar la superficie de la UI; la variante DOCX sí funciona.
 * @param templateId - ID de la plantilla en la base de datos
 * @param data - Variables para reemplazar en el template (opcional)
 */
export async function generatePdfFromMarkdown(
  templateId: string,
  data?: Record<string, unknown>
): Promise<{ buf?: Buffer; error?: string }> {
  try {
    ensureTemplatesDir();

    const template = await prisma.documentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) return { error: 'Plantilla no encontrada' };
    if (template.docType !== 'md') return { error: 'La plantilla no es de tipo Markdown' };

    const filePath = join(TEMPLATES_DIR, template.path);
    if (!existsSync(filePath)) return { error: 'Archivo de plantilla no encontrado en disco' };

    let content = readFileSync(filePath, 'utf8');

    // Reemplazo simple de variables si se proporcionan datos
    if (data && Object.keys(data).length > 0) {
      for (const [key, value] of Object.entries(data)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? ''));
      }
    }

    // md-to-pdf espera path a archivo o config vacía
    const { mdToPdf } = await import('md-to-pdf');
    const pdf = await mdToPdf({ content }, {} as any);

    if (!pdf || !pdf.content) {
      return { error: 'No se pudo generar el PDF' };
    }

    return { buf: pdf.content };
  } catch (error) {
    console.error('[document-actions] generatePdfFromMarkdown error:', error);
    return { error: toUserMessage(error, 'Error generando el PDF. Intenta de nuevo.') };
  }
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

    // Rama DOCX: reutiliza la lógica compartida (generar + guardar + registrar).
    if (template.docType === 'docx') {
      return saveDocxForTask(prisma, taskId, templateId, data);
    }

    // Rama MD/PDF: bug preexistente de puppeteer, fuera de alcance.
    const task = await prisma.tarea.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) return { success: false, error: 'Tarea no encontrada' };
    if (!task.projectId) return { success: false, error: 'La tarea no tiene proyecto asignado' };

    const result = await generatePdfFromMarkdown(templateId, data);
    if (!result.buf) return { success: false, error: result.error };

    const projectDir = join(PROJECT_FILES_DIR, task.projectId);
    if (!existsSync(projectDir)) {
      mkdirSync(projectDir, { recursive: true });
    }

    const fileName = `${Date.now()}_${task.title.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    const filePath = join(projectDir, fileName);
    writeFileSync(filePath, result.buf);

    await prisma.archivo.create({
      data: {
        projectId: task.projectId,
        kind: 'FILE',
        title: `${task.title} - ${template.name}`,
        path: `files/${task.projectId}/${fileName}`,
        mimeType: 'application/pdf',
      },
    });

    return { success: true, filePath };
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
