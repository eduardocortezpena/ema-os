import fs from 'node:fs';
import path from 'node:path';

const FILES_ROOT = path.join(process.cwd(), 'files');

export function projectFilesDir(projectId: string): string {
  return path.join(FILES_ROOT, projectId);
}

export function ensureProjectFilesDir(projectId: string): void {
  fs.mkdirSync(projectFilesDir(projectId), { recursive: true });
}

// --- Notas Markdown (Sprint 3.3) ---
// Las notas viven en files/{projectId}/notes/{archivoId}.md. El nombre de
// archivo usa el id del Archivo (estable, único) en vez del título, para que
// renombrar la nota no deje huérfanos ni colisione con otra del mismo título.

function projectNotesDir(projectId: string): string {
  return path.join(projectFilesDir(projectId), 'notes');
}

// Ruta relativa a la raíz del repo, que es lo que se guarda en Archivo.path.
export function noteRelPath(projectId: string, archivoId: string): string {
  return path.join('files', projectId, 'notes', `${archivoId}.md`);
}

// Ruta absoluta del .md, siempre escopada bajo FILES_ROOT (subcarpeta estática
// conocida) — no usar path.join(process.cwd(), varDinámica) o Turbopack traza
// todo el proyecto al empaquetar.
function noteAbsPath(projectId: string, archivoId: string): string {
  return path.join(FILES_ROOT, projectId, 'notes', `${archivoId}.md`);
}

export function writeNoteMd(projectId: string, archivoId: string, content: string): void {
  fs.mkdirSync(projectNotesDir(projectId), { recursive: true });
  fs.writeFileSync(noteAbsPath(projectId, archivoId), content, 'utf8');
}

// Lee el .md local si existe; null si no está en disco (el caller decide si
// baja de Drive).
export function readNoteMd(projectId: string, archivoId: string): string | null {
  const abs = noteAbsPath(projectId, archivoId);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8');
}

export function deleteNoteMd(projectId: string, archivoId: string): void {
  const abs = noteAbsPath(projectId, archivoId);
  if (fs.existsSync(abs)) fs.rmSync(abs);
}
