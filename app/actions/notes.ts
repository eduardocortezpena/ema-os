'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/app/lib/db';

export async function createNote(formData: FormData) {
  try {
    const title = formData.get('title')?.toString().trim();
    const content = formData.get('content')?.toString().trim() || '';
    const projectId = formData.get('projectId')?.toString() || '';

    if (!title || title.length === 0) {
      console.error('Título de nota requerido');
      return;
    }
    if (!projectId) {
      console.error('Proyecto requerido para la nota');
      return;
    }

    await prisma.nota.create({
      data: { title, content, projectId },
    });

    revalidatePath('/notes');
    revalidatePath('/dashboard');
  } catch (error: any) {
    console.error('Error creando nota:', error.message);
  }
}

export async function updateNote(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';
    const title = formData.get('title')?.toString().trim();
    const content = formData.get('content')?.toString().trim() || '';

    if (!id) {
      console.error('ID de nota requerido');
      return;
    }
    if (!title || title.length === 0) {
      console.error('Título de nota requerido');
      return;
    }

    await prisma.nota.update({
      where: { id },
      data: { title, content },
    });

    revalidatePath('/notes');
  } catch (error: any) {
    console.error('Error actualizando nota:', error.message);
  }
}

export async function deleteNote(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      console.error('ID de nota requerido');
      return;
    }

    await prisma.nota.delete({
      where: { id },
    });

    revalidatePath('/notes');
    revalidatePath('/dashboard');
  } catch (error: any) {
    console.error('Error eliminando nota:', error.message);
  }
}
