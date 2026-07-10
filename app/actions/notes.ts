'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/app/lib/db';

export async function createNote(formData: FormData) {
  try {
    const title = formData.get('title')?.toString().trim();
    const content = formData.get('content')?.toString().trim() || '';
    const projectId = formData.get('projectId')?.toString() || '';

    if (!title || title.length === 0) {
      redirect(`/notes?error=${encodeURIComponent('Título de nota requerido')}`);
    }
    if (!projectId) {
      redirect(`/notes?error=${encodeURIComponent('Proyecto requerido para la nota')}`);
    }

    await prisma.nota.create({
      data: { title, content, projectId },
    });

    revalidatePath('/notes');
    revalidatePath('/dashboard');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/notes?error=${encodeURIComponent('Error creando nota: ' + error.message)}`);
  }
}

export async function updateNote(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';
    const title = formData.get('title')?.toString().trim();
    const content = formData.get('content')?.toString().trim() || '';

    if (!id) {
      redirect(`/notes?error=${encodeURIComponent('ID de nota requerido')}`);
    }
    if (!title || title.length === 0) {
      redirect(`/notes?error=${encodeURIComponent('Título de nota requerido')}`);
    }

    await prisma.nota.update({
      where: { id },
      data: { title, content },
    });

    revalidatePath('/notes');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/notes?error=${encodeURIComponent('Error actualizando nota: ' + error.message)}`);
  }
}

export async function deleteNote(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      redirect(`/notes?error=${encodeURIComponent('ID de nota requerido')}`);
    }

    await prisma.nota.delete({
      where: { id },
    });

    revalidatePath('/notes');
    revalidatePath('/dashboard');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/notes?error=${encodeURIComponent('Error eliminando nota: ' + error.message)}`);
  }
}
