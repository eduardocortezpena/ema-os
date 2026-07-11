import fs from 'node:fs';
import path from 'node:path';

const FILES_ROOT = path.join(process.cwd(), 'files');

export function projectFilesDir(projectId: string): string {
  return path.join(FILES_ROOT, projectId);
}

export function ensureProjectFilesDir(projectId: string): void {
  fs.mkdirSync(projectFilesDir(projectId), { recursive: true });
}
