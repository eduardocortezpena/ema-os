import { getValidAccessToken } from '@/app/lib/google-drive-auth';
import { prisma } from '@/app/lib/db';

const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const MARKDOWN_MIME = 'text/markdown';

// Construye un cuerpo multipart/related (metadata JSON + contenido) para la
// API de subida de Drive. Reusado por create y update.
function buildMultipartBody(
  boundary: string,
  metadata: Record<string, unknown>,
  content: string,
  contentType: string
): string {
  return (
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${contentType}\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`
  );
}

async function driveUpload(
  method: 'POST' | 'PATCH',
  urlSuffix: string,
  metadata: Record<string, unknown>,
  content: string,
  contentType: string
): Promise<string> {
  const accessToken = await getValidAccessToken();
  const boundary = `ema-os-${Date.now()}`;
  const body = buildMultipartBody(boundary, metadata, content, contentType);

  const res = await fetch(`${UPLOAD_URL}${urlSuffix}?uploadType=multipart&fields=id`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[google-drive-files] Error ${method} (${res.status}):`, errBody);
    throw new Error('Error subiendo el archivo a Google Drive. Revisa los logs del servidor.');
  }

  const data = await res.json();
  return data.id as string;
}

/**
 * Sube un `.md` nuevo a Drive (raíz de la cuenta, scope drive.file). Devuelve
 * el driveFileId. Lanza si Drive no está conectado o falla la subida — el
 * caller decide degradar (guardar local con driveFileId null).
 */
export async function createMarkdownInDrive(name: string, content: string): Promise<string> {
  return driveUpload('POST', '', { name, mimeType: MARKDOWN_MIME }, content, MARKDOWN_MIME);
}

/**
 * Actualiza un `.md` ya existente en Drive (PATCH sobre el driveFileId), en
 * vez de crear uno nuevo — evita duplicados en cada guardado. Devuelve el id.
 */
export async function updateMarkdownInDrive(
  driveFileId: string,
  name: string,
  content: string
): Promise<string> {
  return driveUpload('PATCH', `/${driveFileId}`, { name }, content, MARKDOWN_MIME);
}

/**
 * Baja el contenido de un `.md` desde Drive (usado solo cuando el .md local no
 * existe). Lanza si Drive no está conectado o el archivo no está disponible.
 */
export async function downloadMarkdownFromDrive(driveFileId: string): Promise<string> {
  const accessToken = await getValidAccessToken();
  const res = await fetch(`${FILES_URL}/${driveFileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[google-drive-files] Error descargando (${res.status}):`, errBody);
    throw new Error('Error descargando el archivo desde Google Drive.');
  }
  return res.text();
}

const FOLDER_MIME = 'application/vnd.google-apps.folder';

/**
 * Crea una carpeta en Drive (opcionalmente dentro de otra) y devuelve su id.
 * Usado por ensureProjectDriveFolder para la carpeta de proyecto (Sprint 3.4).
 */
export async function createDriveFolder(name: string, parentFolderId?: string): Promise<string> {
  const accessToken = await getValidAccessToken();
  const metadata: Record<string, unknown> = { name, mimeType: FOLDER_MIME };
  if (parentFolderId) metadata.parents = [parentFolderId];

  const res = await fetch(`${FILES_URL}?fields=id`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[google-drive-files] Error creando carpeta (${res.status}):`, errBody);
    throw new Error('Error creando la carpeta en Google Drive.');
  }

  const data = await res.json();
  return data.id as string;
}

/**
 * Devuelve el driveFolderId del proyecto, creándolo en Drive de forma
 * perezosa (lazy) si todavía no existe. Idempotente: si el proyecto ya tiene
 * driveFolderId, no llama a la API. Lanza si Drive no está conectado —
 * el caller decide degradar (guardar solo local).
 */
export async function ensureProjectDriveFolder(projectId: string, projectName: string): Promise<string> {
  const project = await prisma.proyecto.findUnique({ where: { id: projectId } });
  if (project?.driveFolderId) return project.driveFolderId;

  const folderId = await createDriveFolder(projectName);
  await prisma.proyecto.update({ where: { id: projectId }, data: { driveFolderId: folderId } });
  return folderId;
}

/**
 * Sube un archivo binario (o de texto) a Drive dentro de una carpeta, usando
 * FormData/Blob nativo de fetch en vez de concatenar el contenido como string
 * (el multipart hecho a mano de createMarkdownInDrive corrompería binarios).
 * Devuelve el driveFileId.
 */
export async function uploadFileToDrive(
  name: string,
  mimeType: string,
  content: Buffer,
  parentFolderId: string
): Promise<string> {
  const accessToken = await getValidAccessToken();
  const metadata = { name, parents: [parentFolderId] };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([new Uint8Array(content)], { type: mimeType }), name);

  const res = await fetch(`${UPLOAD_URL}?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[google-drive-files] Error subiendo archivo (${res.status}):`, errBody);
    throw new Error('Error subiendo el archivo a Google Drive. Revisa los logs del servidor.');
  }

  const data = await res.json();
  return data.id as string;
}
