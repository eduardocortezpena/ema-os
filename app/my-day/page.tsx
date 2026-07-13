import { prisma } from '@/app/lib/db';
import { planForToday, rolloverToTomorrow, unplanTask } from '../actions';
import { CompleteTaskButton } from '../components/CompleteTaskButton';
import { byPriorityAndDueDate } from '../lib/sort';
import { startOfDay } from '../lib/date';

export default async function MyDayPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayTasksRaw, overdueTasksRaw, availableTasksRaw] = await Promise.all([
    prisma.tarea.findMany({
      where: { plannedFor: { gte: today, lt: tomorrow } },
      include: { project: true },
    }),
    prisma.tarea.findMany({
      where: { plannedFor: { lt: today }, status: { not: 'DONE' } },
      include: { project: true },
    }),
    prisma.tarea.findMany({
      where: { plannedFor: null, status: { not: 'DONE' } },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const todayTasks = [...todayTasksRaw].sort(byPriorityAndDueDate);
  const overdueTasks = [...overdueTasksRaw].sort(byPriorityAndDueDate);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Day</h1>
        </div>

        {error && (
          <p className="bg-danger-500/10 border border-danger-500 text-danger-500 rounded px-3 py-2 mb-4 text-sm">
            {error}
          </p>
        )}

        {overdueTasks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-warning-500">Atrasadas — mover a mañana</h2>
            <div className="space-y-2">
              {overdueTasks.map((task) => (
                <div key={task.id} className="bg-gray-800 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <span>{task.title}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      (
                      {task.project ? (
                        <a href={`/projects/${task.project.id}`} className="hover:text-primary-500 hover:underline">
                          {task.project.name}
                        </a>
                      ) : (
                        'Inbox'
                      )}
                      )
                    </span>
                  </div>
                  <form action={rolloverToTomorrow}>
                    <input type="hidden" name="id" value={task.id} />
                    <button type="submit" className="text-primary-500 hover:text-white text-sm">
                      Mover a mañana
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Hoy</h2>
          {todayTasks.length === 0 ? (
            <p className="text-gray-500">No hay tareas planificadas para hoy. Elige algunas abajo.</p>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((task) => (
                <div key={task.id} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        {task.status === 'DONE' && <span className="text-green-400 text-sm">✓ Completada</span>}
                      </div>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                        {task.project ? (
                          <a href={`/projects/${task.project.id}`} className="badge bg-gray-700 hover:bg-gray-600">
                            {task.project.name}
                          </a>
                        ) : (
                          <span className="badge bg-gray-700">Inbox</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <CompleteTaskButton taskId={task.id} status={task.status} returnTo="/my-day" />
                      <form action={unplanTask}>
                        <input type="hidden" name="id" value={task.id} />
                        <button type="submit" className="text-gray-500 hover:text-white text-xs">
                          Quitar de hoy
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Elegir tareas para hoy</h2>
          {availableTasksRaw.length === 0 ? (
            <p className="text-gray-500">No hay tareas disponibles para planificar.</p>
          ) : (
            <div className="space-y-2">
              {availableTasksRaw.map((task) => (
                <div key={task.id} className="bg-gray-800 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <span>{task.title}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      (
                      {task.project ? (
                        <a href={`/projects/${task.project.id}`} className="hover:text-primary-500 hover:underline">
                          {task.project.name}
                        </a>
                      ) : (
                        'Inbox'
                      )}
                      )
                    </span>
                    <span className={`badge badge-${task.priority.toLowerCase()} ml-2`}>{task.priority}</span>
                  </div>
                  <form action={planForToday}>
                    <input type="hidden" name="id" value={task.id} />
                    <button type="submit" className="text-primary-500 hover:text-white text-sm">
                      + Agregar a hoy
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
