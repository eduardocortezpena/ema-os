'use server';

// Acciones de creación rápida para la command palette (Sprint 7.1). Reciben
// argumentos simples (no FormData) porque se llaman directo desde un
// componente cliente, no desde un <form>. Delegan en las Server Actions
// existentes construyendo el FormData que ya esperan, para no duplicar la
// lógica de validación/creación.
import { createProject } from './project-actions';
import { createTask, updateTaskPriority, updateTaskStatus } from './task-actions';
import { createNote } from './notes';
import { nextPriority } from '@/app/lib/priority';
import { nextStatus } from '@/app/lib/status';

export async function quickCreateProject(name: string): Promise<void> {
  const fd = new FormData();
  fd.set('name', name);
  fd.set('priority', 'LOW');
  fd.set('status', 'PLANNING');
  await createProject(fd);
}

export async function quickCreateTask(projectId: string, title: string): Promise<void> {
  const fd = new FormData();
  fd.set('title', title);
  fd.set('projectId', projectId);
  fd.set('priority', 'LOW');
  fd.set('status', 'TODO');
  await createTask(fd);
}

export async function quickCreateNote(projectId: string, title: string): Promise<void> {
  const fd = new FormData();
  fd.set('title', title);
  fd.set('projectId', projectId);
  fd.set('content', '');
  await createNote(fd);
}

// Usado por el atajo de teclado "P" (Sprint 7.2): avanza la prioridad de una
// tarea al siguiente valor del ciclo. Delega en updateTaskPriority existente.
export async function quickCyclePriority(taskId: string, currentPriority: string): Promise<void> {
  const fd = new FormData();
  fd.set('id', taskId);
  fd.set('priority', nextPriority(currentPriority));
  await updateTaskPriority(fd);
}

// Usado por el badge de estado cíclico en TaskCard.tsx (Sesión de mejoras de
// UX, Parte 5b): avanza el estado al siguiente valor del ciclo completo
// (TODO→IN_PROGRESS→WAITING→DONE→TODO). Delega en updateTaskStatus existente
// — conserva el efecto secundario de borrar el evento de Calendar al llegar
// a DONE (Sprint 4.2), sin duplicar esa lógica aquí.
export async function quickCycleStatus(taskId: string, currentStatus: string, returnTo?: string): Promise<void> {
  const fd = new FormData();
  fd.set('id', taskId);
  fd.set('status', nextStatus(currentStatus));
  if (returnTo) fd.set('returnTo', returnTo);
  await updateTaskStatus(fd);
}
