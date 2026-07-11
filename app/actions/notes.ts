'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/app/lib/db';
import { toUserMessage } from '@/app/lib/errors';
import { noteRelPath, writeNoteMd, readNoteMd, deleteNoteMd } from '@/app/lib/files';
import {
  createMarkdownInDrive,
  updateMarkdownInDrive,
  downloadMarkdownFromDrive,
} from '@/app/lib/google-drive-files';

const MARKDOWN_MIME = 'text/markdown';

// Intenta espejar el .md a Drive sin nunca hacer fallar el guardado: el .md
// local ya es la fuente de verdad. Devuelve el driveFileId resultante (nuevo,
// actualizado, o el previo si el espejo falló).
async function mirrorToDrive(
  title: string,
  content: string,
  existingDriveFileId: string | null
): Promise<string | null> {
  const name = `${title}.md`;
  try {
    if (existingDriveFileId) {
      return await updateMarkdownInDrive(existingDriveFileId, name, content);
    }
    return await createMarkdownInDrive(name, content);
  } catch (error) {
    console.error('[notes] No se pudo espejar la nota a Drive (se guardó local):', error);
    return existingDriveFileId;
  }
}

/**
 * Devuelve el contenido de una nota por id: .md local si existe; si no, lo baja
 * de Drive; si tampoco, cadena vacía. Usado por la página /notes (server).
 * Busca el Archivo en la DB por id — no confía en projectId/driveFileId del
 * cliente (esto es un server action expuesto). Ver reviewer M2.
 */
export async function getNoteContent(id: string): Promise<string> {
  const archivo = await prisma.archivo.findUnique({ where: { id } });
  if (!archivo || archivo.kind !== 'NOTE') return '';
  const local = readNoteMd(archivo.projectId, archivo.id);
  if (local !== null) return local;
  if (archivo.driveFileId) {
    try {
      return await downloadMarkdownFromDrive(archivo.driveFileId);
    } catch (error) {
      console.error('[notes] No se pudo bajar la nota de Drive:', error);
    }
  }
  return '';
}

export async function createNote(formData: FormData) {
  try {
    const title = formData.get('title')?.toString().trim();
    const content = formData.get('content')?.toString() ?? '';
    const projectId = formData.get('projectId')?.toString() || '';

    if (!title || title.length === 0) {
      redirect(`/notes?error=${encodeURIComponent('Título de nota requerido')}`);
    }
    if (!projectId) {
      redirect(`/notes?error=${encodeURIComponent('Proyecto requerido para la nota')}`);
    }

    // Validar que el proyecto existe ANTES de usar projectId en una ruta de
    // disco (evita path traversal con un projectId manipulado y filas huérfanas
    // por FK inválida). Ver reviewer M3.
    const project = await prisma.proyecto.findUnique({ where: { id: projectId } });
    if (!project) {
      redirect(`/notes?error=${encodeURIComponent('Proyecto no encontrado')}`);
    }

    // Crear la fila primero para tener el id estable que nombra el .md.
    const archivo = await prisma.archivo.create({
      data: { projectId, kind: 'NOTE', title, path: '', mimeType: MARKDOWN_MIME },
    });

    writeNoteMd(projectId, archivo.id, content);
    const driveFileId = await mirrorToDrive(title, content, null);

    await prisma.archivo.update({
      where: { id: archivo.id },
      data: { path: noteRelPath(projectId, archivo.id), driveFileId },
    });

    revalidatePath('/notes');
    revalidatePath('/files');
    revalidatePath('/dashboard');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/notes?error=${encodeURIComponent(toUserMessage(error, 'Error creando nota. Intenta de nuevo.'))}`);
  }
}

export async function updateNote(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';
    const title = formData.get('title')?.toString().trim();
    const content = formData.get('content')?.toString() ?? '';

    if (!id) {
      redirect(`/notes?error=${encodeURIComponent('ID de nota requerido')}`);
    }
    if (!title || title.length === 0) {
      redirect(`/notes?error=${encodeURIComponent('Título de nota requerido')}`);
    }

    const archivo = await prisma.archivo.findUnique({ where: { id } });
    if (!archivo || archivo.kind !== 'NOTE') {
      redirect(`/notes?error=${encodeURIComponent('Nota no encontrada')}`);
    }

    writeNoteMd(archivo.projectId, archivo.id, content);
    const driveFileId = await mirrorToDrive(title, content, archivo.driveFileId);

    await prisma.archivo.update({
      where: { id },
      data: { title, path: noteRelPath(archivo.projectId, archivo.id), driveFileId },
    });

    revalidatePath('/notes');
    revalidatePath('/files');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/notes?error=${encodeURIComponent(toUserMessage(error, 'Error actualizando nota. Intenta de nuevo.'))}`);
  }
}

/**
 * Backfill idempotente Nota (SQLite) -> Archivo(kind=NOTE) + .md (local+Drive).
 * NO borra ninguna `Nota` (respaldo reversible). Re-ejecutable: salta las que
 * ya tienen un Archivo con sourceNotaId. El drop de `Nota` es un paso posterior
 * separado y verificado (Sprint 3.3, fase final). Redirige a /settings con el
 * conteo migrado como evidencia.
 */
export async function migrateLegacyNotes() {
  let migrated = 0;
  try {
    const legacy = await prisma.nota.findMany();
    for (const nota of legacy) {
      const already = await prisma.archivo.findUnique({ where: { sourceNotaId: nota.id } });
      if (already) continue;

      const archivo = await prisma.archivo.create({
        data: {
          projectId: nota.projectId,
          kind: 'NOTE',
          title: nota.title,
          path: '',
          mimeType: MARKDOWN_MIME,
          sourceNotaId: nota.id,
        },
      });
      writeNoteMd(nota.projectId, archivo.id, nota.content);
      const driveFileId = await mirrorToDrive(nota.title, nota.content, null);
      await prisma.archivo.update({
        where: { id: archivo.id },
        data: { path: noteRelPath(nota.projectId, archivo.id), driveFileId },
      });
      migrated++;
    }

    revalidatePath('/notes');
    revalidatePath('/files');
    redirect(`/settings?drive=migrated&count=${migrated}`);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/settings?error=${encodeURIComponent(toUserMessage(error, 'Error migrando notas antiguas.'))}`);
  }
}

export async function deleteNote(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      redirect(`/notes?error=${encodeURIComponent('ID de nota requerido')}`);
    }

    const archivo = await prisma.archivo.findUnique({ where: { id } });
    if (archivo && archivo.kind === 'NOTE') {
      deleteNoteMd(archivo.projectId, archivo.id);
      await prisma.archivo.delete({ where: { id } });
    }

    revalidatePath('/notes');
    revalidatePath('/files');
    revalidatePath('/dashboard');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/notes?error=${encodeURIComponent(toUserMessage(error, 'Error eliminando nota. Intenta de nuevo.'))}`);
  }
}
