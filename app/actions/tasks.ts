'use server';

import { prisma } from '@/app/generated/prisma';

export async function createTask(data: {
  projectId: string;
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE';
  dueDate?: string;
}) {
  return prisma.tarea.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      dueDate: new Date(data.dueDate || '1970-01-01'),
      project: { connect: { id: data.projectId } },
    },
  });
}

export async function getTasks(projectId: string) {
  return prisma.tarea.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTask(id: string) {
  return prisma.tarea.findUnique({
    where: { id },
  });
}

export async function updateTask(id: string, data: any) {
  return prisma.tarea.update({
    where: { id },
    data,
  });
}

export async function deleteTask(id: string) {
  return prisma.tarea.delete({
    where: { id },
  });
}