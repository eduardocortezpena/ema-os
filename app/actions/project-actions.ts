'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/app/lib/db';
export async function createProject(formData: FormData) {
  try {
    const name = formData.get('name')?.toString().trim();
    const description = formData.get('description')?.toString().trim() || null;
    const priority = (formData.get('priority')?.toString() || 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    const status = (formData.get('status')?.toString() || 'PLANNING') as 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    const nextAction = formData.get('nextAction')?.toString().trim() || null;

    if (!name || name.length === 0) {
      console.error('Nombre de proyecto requerido');
      return;
    }

    await prisma.proyecto.create({
      data: {
        name: name,
        description: description,
        priority: priority,
        status: status,
        nextAction: nextAction
      },
    });

    revalidatePath('/projects');
    revalidatePath('/dashboard');
  } catch (error: any) {
    console.error('Error creando proyecto:', error.message);
  }
}

export async function updateProject(formData: FormData) {
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
      console.error('ID de proyecto requerido');
      return;
    }
    if (!name || name.length === 0) {
      console.error('Nombre de proyecto requerido');
      return;
    }

    await prisma.proyecto.update({
      where: { id },
      data: { name, description, priority, status, progress, nextAction },
    });

    revalidatePath('/projects');
    revalidatePath('/dashboard');
  } catch (error: any) {
    console.error('Error actualizando proyecto:', error.message);
  }
}

export async function deleteProject(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      console.error('ID de proyecto requerido');
      return;
    }

    await prisma.proyecto.delete({
      where: { id },
    });

    revalidatePath('/projects');
    revalidatePath('/dashboard');
  } catch (error: any) {
    console.error('Error eliminando proyecto:', error.message);
  }
}