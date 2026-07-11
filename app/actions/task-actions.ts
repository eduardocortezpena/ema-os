'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/app/lib/db';
import { toUserMessage } from '@/app/lib/errors';

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
    if (!projectId) {
      redirect(`/tasks?error=${encodeURIComponent('Proyecto requerido para la tarea')}`);
    }

    const dueDate = dueDateStr ? new Date(dueDateStr) : null;

    await prisma.tarea.create({
      data: {
        title: title,
        description: description,
        priority: priority,
        status: status,
        dueDate: dueDate,
        projectId: projectId,
      },
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/tasks?error=${encodeURIComponent(toUserMessage(error, 'Error creando tarea. Intenta de nuevo.'))}`);
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
