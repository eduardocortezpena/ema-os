'use server';

import { prisma } from '@/app/lib/db';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { redirect } from 'next/navigation';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
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
  try {
    ensureTemplatesDir();

    const name = formData.get('name')?.toString().trim();
    const docType = formData.get('docType')?.toString().trim();
    const projectId = formData.get('projectId')?.toString() || null;

    if (!name || !docType) {
      redirect(`/settings?error=${encodeURIComponent('Nombre y tipo de documento son requeridos')}`);
    }

    const file = formData.get('template') as File;
    if (!file || file.size === 0) {
      redirect(`/settings?error=${encodeURIComponent('Archivo de plantilla requerido')}`);
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
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[document-actions] registerDocumentTemplate error:', error);
    redirect(`/settings?error=${encodeURIComponent(toUserMessage(error, 'Error registrando la plantilla. Intenta de nuevo.'))}`);
  }
}

/**
 * Genera un documento .docx a partir de una plantilla y datos proporcionados.
 * @param templateId - ID de la plantilla en la base de datos
 * @param data - Objeto con los datos para rellenar la plantilla
 */
export async function generateDocxFromTemplate(
  templateId: string,
  data: Record<string, unknown>
): Promise<{ buf?: Buffer; error?: string }> {
  try {
    ensureTemplatesDir();

    const template = await prisma.documentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) return { error: 'Plantilla no encontrada' };
    if (template.docType !== 'docx') return { error: 'La plantilla no es de tipo docx' };

    const filePath = join(TEMPLATES_DIR, template.path);
    if (!existsSync(filePath)) return { error: 'Archivo de plantilla no encontrado en disco' };

    const content = readFileSync(filePath);
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    doc.setData(data);
    doc.render();

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    return { buf };
  } catch (error) {
    console.error('[document-actions] generateDocxFromTemplate error:', error);
    return { error: toUserMessage(error, 'Error generando el documento. Intenta de nuevo.') };
  }
}