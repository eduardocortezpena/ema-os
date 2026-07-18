'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/app/lib/db';
import { toUserMessage } from '@/app/lib/errors';
import { uploadedFileRelPath, writeUploadedFile } from '@/app/lib/files';
import { ensureProjectDriveFolder, uploadFileToDrive } from '@/app/lib/google-drive-files';

// Intenta espejar el archivo a Drive (carpeta del proyecto, creada lazy) sin
// nunca hacer fallar la subida: el archivo local ya es la fuente de verdad.
// Mismo patrón que mirrorToDrive en notes.ts.
async function mirrorFileToDrive(
  projectId: string,
  projectName: string,
  name: string,
  mimeType: string,
  content: Buffer
): Promise<string | null> {
  try {
    const folderId = await ensureProjectDriveFolder(projectId, projectName);
    return await uploadFileToDrive(name, mimeType, content, folderId);
  } catch (error) {
    console.error('[files] No se pudo espejar el archivo a Drive (se guardó local):', error);
    return null;
  }
}

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'text/markdown',
  'text/plain',
]);

const ALLOWED_EXT = new Set(['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.md', '.txt']);

function validateUpload(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) return 'El archivo supera el límite de 25 MB';
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const mime = file.type || '';
  if (!ALLOWED_EXT.has(ext) || (!ALLOWED_MIME.has(mime) && mime !== '')) {
    return 'Tipo de archivo no permitido. Formatos aceptados: PDF, DOCX, XLSX, PNG, JPG, MD';
  }
  return null;
}

export async function uploadFile(formData: FormData) {
  try {
    const projectId = formData.get('projectId')?.toString() || '';
    const file = formData.get('file');

    if (!projectId) {
      redirect(`/files?error=${encodeURIComponent('Proyecto requerido')}`);
    }
    if (!(file instanceof File) || file.size === 0) {
      redirect(`/files?error=${encodeURIComponent('Selecciona un archivo')}`);
    }

    const validationError = validateUpload(file as File);
    if (validationError) {
      redirect(`/files?error=${encodeURIComponent(validationError)}`);
    }

    // Validar que el proyecto existe ANTES de usar projectId en una ruta de
    // disco (mismo guard que createNote contra path traversal / filas huérfanas).
    const project = await prisma.proyecto.findUnique({ where: { id: projectId } });
    if (!project) {
      redirect(`/files?error=${encodeURIComponent('Proyecto no encontrado')}`);
    }

    const uploadedFile = file as File;
    const buffer = Buffer.from(await uploadedFile.arrayBuffer());
    const mimeType = uploadedFile.type || 'application/octet-stream';

    // Crear la fila primero para tener el id estable que nombra el archivo local.
    const archivo = await prisma.archivo.create({
      data: { projectId, kind: 'FILE', title: uploadedFile.name, path: '', mimeType },
    });

    writeUploadedFile(projectId, archivo.id, uploadedFile.name, buffer);
    const driveFileId = await mirrorFileToDrive(
      projectId,
      project!.name,
      uploadedFile.name,
      mimeType,
      buffer
    );

    await prisma.archivo.update({
      where: { id: archivo.id },
      data: { path: uploadedFileRelPath(projectId, archivo.id, uploadedFile.name), driveFileId },
    });

    revalidatePath('/files');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/files?error=${encodeURIComponent(toUserMessage(error, 'Error subiendo archivo. Intenta de nuevo.'))}`);
  }
}
