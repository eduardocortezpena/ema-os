'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/app/lib/db';
export async function createTask(formData: FormData) {
  try {
    const title = formData.get('title')?.toString().trim();
    const description = formData.get('description')?.toString().trim() || null;
    const priority = (formData.get('priority')?.toString() || 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    const status = (formData.get('status')?.toString() || 'TODO') as 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE';
    const dueDateStr = formData.get('dueDate')?.toString().trim() || null;
    const projectId = formData.get('projectId')?.toString() || '';

    if (!title || title.length === 0) {
      console.error('Título de tarea requerido');
      return;
    }
    if (!projectId) {
      console.error('Proyecto requerido para la tarea');
      return;
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
    console.error('Error creando tarea:', error.message);
  }
}

export async function updateTaskStatus(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';
    const status = formData.get('status')?.toString() as 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE';

    if (!id) {
      console.error('ID de tarea requerido');
      return;
    }
    if (!['TODO', 'IN_PROGRESS', 'WAITING', 'DONE'].includes(status)) {
      console.error('Status inválido');
      return;
    }

    await prisma.tarea.update({
      where: { id },
      data: { status },
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
  } catch (error: any) {
    console.error('Error actualizando status de tarea:', error.message);
  }
}

export async function deleteTask(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      console.error('ID de tarea requerido');
      return;
    }

    await prisma.tarea.delete({
      where: { id },
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
  } catch (error: any) {
    console.error('Error eliminando tarea:', error.message);
  }
}