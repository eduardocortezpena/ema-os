'use server';

import { prisma } from '@/app/lib/prisma';

export async function createNote(data: {
  title: string;
  content: string;
  taskId: string;
}) {
  return prisma.nota.create({
    data: {
      title: data.title,
      content: data.content,
      taskId: data.taskId,
    },
  });
}

export async function getNotes(taskId?: string) {
  return prisma.nota.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getNote(id: string) {
  return prisma.nota.findUnique({
    where: { id },
  });
}

export async function updateNote(id: string, data: Partial<{
  title: string;
  content: string;
}>) {
  return prisma.nota.update({
    where: { id },
    data,
  });
}

export async function deleteNote(id: string) {
  return prisma.nota.delete({
    where: { id },
  });
}