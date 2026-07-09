'use server';

import { prisma } from '@/app/generated/prisma';

export async function createProject(data: {
  name: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  progress?: number;
  nextAction?: string;
}) {
  return prisma.proyecto.create({
    data: {
      name: data.name,
      description: data.description,
      priority: data.priority || 'LOW',
      status: data.status || 'PLANNING',
      progress: data.progress || 0,
      nextAction: data.nextAction,
    },
  });
}

export async function getProjects() {
  return prisma.proyecto.findMany({
    include: { tasks: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProject(id: string) {
  return prisma.proyecto.findUnique({
    where: { id },
    include: { tasks: true },
  });
}

export async function updateProject(id: string, data: any) {
  return prisma.proyecto.update({
    where: { id },
    data,
  });
}

export async function deleteProject(id: string) {
  return prisma.proyecto.delete({
    where: { id },
  });
}
