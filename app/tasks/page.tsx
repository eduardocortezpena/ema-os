import { prisma } from '@/app/lib/db';
import { TaskBoard } from '../components/TaskBoard';
import { byPriorityAndDueDate } from '../lib/sort';

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; estado?: string }>;
}) {
  const { error, estado } = await searchParams;
  // Sesión de mejoras de UX, Parte 3: tarjeta "Tareas abiertas" del
  // dashboard enlaza aquí con ?estado=abiertas. Filtrado server-side antes
  // de pasar a TaskBoard — TaskBoard no necesita saber que ya viene
  // filtrada (mismo patrón que Sprint 9.4 en el dashboard).
  const [tasksRaw, projects] = await Promise.all([
    prisma.tarea.findMany({
      where: estado === 'abiertas' ? { status: { not: 'DONE' } } : undefined,
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
          <h1 className="text-2xl font-bold">Tareas{estado === 'abiertas' ? ' — Abiertas' : ''}</h1>
        </div>

        {error && (
          <p className="bg-danger-500/10 border border-danger-500 text-danger-500 rounded px-3 py-2 mb-4 text-sm">
            {error}
          </p>
        )}

        <TaskBoard tasks={tasks} projects={projects} />
      </div>
    </div>
  );
}
