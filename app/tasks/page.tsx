import { prisma } from '@/app/lib/db';
import { TaskBoard } from '../components/TaskBoard';
import { byPriorityAndDueDate } from '../lib/sort';

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [tasksRaw, projects] = await Promise.all([
    prisma.tarea.findMany({
      include: {
        project: true,
      },
    }),
    prisma.proyecto.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);
  const tasks = [...tasksRaw].sort(byPriorityAndDueDate);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Tareas</h1>
        </div>

        {error && (
          <p className="bg-danger-500/10 border border-danger-500 text-danger-500 rounded px-3 py-2 mb-4 text-sm">
            {error}
          </p>
        )}

        {projects.length === 0 && (
          <p className="text-amber-400 mb-4">
            ⚠️ Necesitas crear un proyecto primero antes de crear tareas.
          </p>
        )}

        <TaskBoard tasks={tasks} projects={projects} />
      </div>
    </div>
  );
}
