import { prisma } from '@/app/lib/db';
import { TaskBoard } from '../components/TaskBoard';
import { TasksFilters } from '../components/TasksFilters';
import { byPriorityAndDueDate } from '../lib/sort';

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    estado?: string;
    proyecto?: string;
    prioridad?: string;
    orden?: string;
    dir?: string;
  }>;
}) {
  const { error, estado = 'abiertas', proyecto, prioridad, orden = 'prioridad', dir = 'asc' } =
    await searchParams;

  // Filtros server-side vía URL searchParams (UX tareas v2). Default
  // estado='abiertas' (≠ DONE) para que las completadas no saturen el listado
  // — viven en la sección colapsada de abajo. El dashboard enlaza aquí con
  // ?estado=abiertas (retrocompatible).
  const [tasksRaw, projects, recentCompleted] = await Promise.all([
    prisma.tarea.findMany({
      where: {
        ...(estado === 'completadas'
          ? { status: 'DONE' }
          : estado === 'todas'
            ? {}
            : { status: { not: 'DONE' } }),
        ...(proyecto ? { projectId: proyecto } : {}),
        ...(prioridad ? { priority: prioridad as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' } : {}),
      },
      include: { project: true },
    }),
    prisma.proyecto.findMany({ orderBy: { name: 'asc' } }),
    // "Completadas recientes": solo con completedAt (las legacy null no son
    // "recientes"). Se oculta cuando el listado principal ya muestra las
    // completadas, para no duplicar.
    estado === 'completadas'
      ? Promise.resolve([])
      : prisma.tarea.findMany({
          where: { status: 'DONE', completedAt: { not: null } },
          orderBy: { completedAt: 'desc' },
          take: 10,
          include: { project: true },
        }),
  ]);

  const mult = dir === 'desc' ? -1 : 1;
  const tasks = [...tasksRaw].sort((a, b) => {
    if (orden === 'vencimiento') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1; // sin fecha → siempre al final
      if (!b.dueDate) return -1;
      return mult * (a.dueDate.getTime() - b.dueDate.getTime());
    }
    if (orden === 'creacion') {
      return mult * (a.createdAt.getTime() - b.createdAt.getTime());
    }
    return byPriorityAndDueDate(a, b); // 'prioridad' (default); dir se ignora
  });

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

        <TasksFilters projects={projects.map((p) => ({ id: p.id, name: p.name }))} />

        <TaskBoard tasks={tasks} projects={projects} />

        {recentCompleted.length > 0 && (
          <details className="mt-8">
            <summary className="text-lg font-semibold cursor-pointer text-gray-300 hover:text-gray-100">
              Completadas recientes ({recentCompleted.length})
            </summary>
            <div className="space-y-2 mt-3">
              {recentCompleted.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between bg-gray-800/60 p-3 rounded-lg gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-400 line-through">{task.title}</span>
                    {task.project && (
                      <span className="text-gray-500 text-sm ml-2">({task.project.name})</span>
                    )}
                  </div>
                  <span className="badge bg-gray-700 text-gray-400 shrink-0">
                    {task.completedAt?.toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
