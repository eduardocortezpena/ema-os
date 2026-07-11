'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/app/lib/db';
import { toUserMessage } from '@/app/lib/errors';
import { startOfDay } from '@/app/lib/date';

export async function createTask(formData: FormData) {
  try {
    const title = formData.get('title')?.toString().trim();
    const description = formData.get('description')?.toString().trim() || null;
    const priority = (formData.get('priority')?.toString() || 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    const status = (formData.get('status')?.toString() || 'TODO') as 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE';
    const dueDateStr = formData.get('dueDate')?.toString().trim() || null;
    const projectId = formData.get('projectId')?.toString() || '';

    if (!title || title.length === 0) {
      redirect(`/tasks?error=${encodeURIComponent('Título de tarea requerido')}`);
    }

    // projectId vacío = ítem de inbox sin clasificar (Sprint 7.4, Quick
    // Capture) — ya no es obligatorio. Si viene, sí debe existir de verdad
    // (mismo guard que createNote, contra proyecto borrado/inválido).
    if (projectId) {
      const project = await prisma.proyecto.findUnique({ where: { id: projectId } });
      if (!project) {
        redirect(`/tasks?error=${encodeURIComponent('Proyecto no encontrado')}`);
      }
    }

    const dueDate = dueDateStr ? new Date(dueDateStr) : null;

    await prisma.tarea.create({
      data: {
        title: title,
        description: description,
        priority: priority,
        status: status,
        dueDate: dueDate,
        projectId: projectId || null,
      },
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    revalidatePath('/inbox');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/tasks?error=${encodeURIComponent(toUserMessage(error, 'Error creando tarea. Intenta de nuevo.'))}`);
  }
}

/**
 * Clasifica un ítem de inbox: le asigna un proyecto (Sprint 7.4). Simple
 * update de projectId — el ítem deja de ser inbox en cuanto projectId deja
 * de ser null. Valida que el proyecto destino exista (mismo guard que
 * createTask).
 */
export async function assignTaskToProject(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';
    const projectId = formData.get('projectId')?.toString() || '';

    if (!id) {
      redirect(`/inbox?error=${encodeURIComponent('ID de tarea requerido')}`);
    }
    if (!projectId) {
      redirect(`/inbox?error=${encodeURIComponent('Selecciona un proyecto')}`);
    }

    const project = await prisma.proyecto.findUnique({ where: { id: projectId } });
    if (!project) {
      redirect(`/inbox?error=${encodeURIComponent('Proyecto no encontrado')}`);
    }

    await prisma.tarea.update({
      where: { id },
      data: { projectId },
    });

    revalidatePath('/inbox');
    revalidatePath('/tasks');
    revalidatePath('/dashboard');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/inbox?error=${encodeURIComponent(toUserMessage(error, 'Error clasificando la tarea. Intenta de nuevo.'))}`);
  }
}

export async function updateTaskStatus(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';
    const status = formData.get('status')?.toString() as 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE';

    if (!id) {
      redirect(`/tasks?error=${encodeURIComponent('ID de tarea requerido')}`);
    }
    if (!['TODO', 'IN_PROGRESS', 'WAITING', 'DONE'].includes(status)) {
      redirect(`/tasks?error=${encodeURIComponent('Status inválido')}`);
    }

    await prisma.tarea.update({
      where: { id },
      data: { status },
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/tasks?error=${encodeURIComponent(toUserMessage(error, 'Error actualizando la tarea. Intenta de nuevo.'))}`);
  }
}

export async function updateTaskPriority(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';
    const priority = formData.get('priority')?.toString() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

    if (!id) {
      redirect(`/tasks?error=${encodeURIComponent('ID de tarea requerido')}`);
    }
    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priority)) {
      redirect(`/tasks?error=${encodeURIComponent('Prioridad inválida')}`);
    }

    await prisma.tarea.update({
      where: { id },
      data: { priority },
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/tasks?error=${encodeURIComponent(toUserMessage(error, 'Error actualizando la prioridad. Intenta de nuevo.'))}`);
  }
}

export async function planForToday(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      redirect(`/my-day?error=${encodeURIComponent('ID de tarea requerido')}`);
    }

    await prisma.tarea.update({
      where: { id },
      data: { plannedFor: startOfDay(new Date()) },
    });

    revalidatePath('/my-day');
    revalidatePath('/tasks');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/my-day?error=${encodeURIComponent(toUserMessage(error, 'Error planificando la tarea. Intenta de nuevo.'))}`);
  }
}

export async function rolloverToTomorrow(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      redirect(`/my-day?error=${encodeURIComponent('ID de tarea requerido')}`);
    }

    const tomorrow = startOfDay(new Date());
    tomorrow.setDate(tomorrow.getDate() + 1);

    await prisma.tarea.update({
      where: { id },
      data: { plannedFor: tomorrow },
    });

    revalidatePath('/my-day');
    revalidatePath('/tasks');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/my-day?error=${encodeURIComponent(toUserMessage(error, 'Error moviendo la tarea a mañana. Intenta de nuevo.'))}`);
  }
}

export async function unplanTask(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      redirect(`/my-day?error=${encodeURIComponent('ID de tarea requerido')}`);
    }

    await prisma.tarea.update({
      where: { id },
      data: { plannedFor: null },
    });

    revalidatePath('/my-day');
    revalidatePath('/tasks');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/my-day?error=${encodeURIComponent(toUserMessage(error, 'Error quitando la tarea de hoy. Intenta de nuevo.'))}`);
  }
}

export async function deleteTask(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      redirect(`/tasks?error=${encodeURIComponent('ID de tarea requerido')}`);
    }

    await prisma.tarea.delete({
      where: { id },
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/tasks?error=${encodeURIComponent(toUserMessage(error, 'Error eliminando tarea. Intenta de nuevo.'))}`);
  }
}
