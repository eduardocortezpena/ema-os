'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/app/lib/db';
import { toUserMessage } from '@/app/lib/errors';
import { ensureProjectFilesDir } from '@/app/lib/files';

// Ver taskReturnTo/noteReturnTo (Sprint 9.1): updateProject/setNextAction
// ahora también se invocan desde /projects/[id], no solo desde /projects.
function projectReturnTo(formData: FormData): string {
  const value = formData.get('returnTo')?.toString() || '';
  return value.startsWith('/') && !value.startsWith('//') ? value : '/projects';
}

export async function createProject(formData: FormData) {
  try {
    const name = formData.get('name')?.toString().trim();
    const description = formData.get('description')?.toString().trim() || null;
    const priority = (formData.get('priority')?.toString() || 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    const status = (formData.get('status')?.toString() || 'PLANNING') as 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    const nextAction = formData.get('nextAction')?.toString().trim() || null;

    if (!name || name.length === 0) {
      redirect(`/projects?error=${encodeURIComponent('Nombre de proyecto requerido')}`);
    }

    const project = await prisma.proyecto.create({
      data: {
        name: name,
        description: description,
        priority: priority,
        status: status,
        nextAction: nextAction
      },
    });

    ensureProjectFilesDir(project.id);

    revalidatePath('/projects');
    revalidatePath('/dashboard');
    // El layout raíz lee la lista de proyectos (command palette, Sprint 7.1) y
    // puede quedar cacheado estáticamente al no usar APIs dinámicas.
    revalidatePath('/', 'layout');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/projects?error=${encodeURIComponent(toUserMessage(error, 'Error creando proyecto. Intenta de nuevo.'))}`);
  }
}

export async function updateProject(formData: FormData) {
  const returnTo = projectReturnTo(formData);
  try {
    const id = formData.get('id')?.toString() || '';
    const name = formData.get('name')?.toString().trim();
    const description = formData.get('description')?.toString().trim() || null;
    const priority = (formData.get('priority')?.toString() || 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    const status = (formData.get('status')?.toString() || 'PLANNING') as 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    const rawProgress = Number(formData.get('progress')?.toString() || '0');
    const progress = Math.min(100, Math.max(0, Number.isFinite(rawProgress) ? rawProgress : 0));
    const nextAction = formData.get('nextAction')?.toString().trim() || null;

    if (!id) {
      redirect(`${returnTo}?error=${encodeURIComponent('ID de proyecto requerido')}`);
    }
    if (!name || name.length === 0) {
      redirect(`${returnTo}?error=${encodeURIComponent('Nombre de proyecto requerido')}`);
    }

    await prisma.proyecto.update({
      where: { id },
      data: { name, description, priority, status, progress, nextAction },
    });

    revalidatePath('/projects');
    revalidatePath('/dashboard');
    revalidatePath('/', 'layout');
    revalidatePath(returnTo);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`${returnTo}?error=${encodeURIComponent(toUserMessage(error, 'Error actualizando proyecto. Intenta de nuevo.'))}`);
  }
}

export async function setNextAction(formData: FormData) {
  const returnTo = projectReturnTo(formData);
  try {
    const projectId = formData.get('projectId')?.toString() || '';
    const taskId = formData.get('taskId')?.toString() || '';

    if (!projectId) {
      redirect(`${returnTo}?error=${encodeURIComponent('ID de proyecto requerido')}`);
    }

    if (taskId) {
      const task = await prisma.tarea.findFirst({ where: { id: taskId, projectId } });
      if (!task) {
        redirect(`${returnTo}?error=${encodeURIComponent('La tarea no pertenece a este proyecto')}`);
      }
    }

    await prisma.proyecto.update({
      where: { id: projectId },
      data: { nextActionTaskId: taskId || null },
    });

    revalidatePath('/projects');
    revalidatePath('/dashboard');
    revalidatePath(returnTo);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`${returnTo}?error=${encodeURIComponent(toUserMessage(error, 'Error marcando la siguiente acción. Intenta de nuevo.'))}`);
  }
}

export async function deleteProject(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      redirect(`/projects?error=${encodeURIComponent('ID de proyecto requerido')}`);
    }

    await prisma.proyecto.delete({
      where: { id },
    });

    revalidatePath('/projects');
    revalidatePath('/dashboard');
    revalidatePath('/', 'layout');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/projects?error=${encodeURIComponent(toUserMessage(error, 'Error eliminando proyecto. Intenta de nuevo.'))}`);
  }
}
