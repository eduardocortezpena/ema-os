import { prisma } from '@/app/lib/db';
import { byPriorityAndDueDate } from '../lib/sort';
import { startOfDay } from '../lib/date';
import { DashboardFilters } from '../components/DashboardFilters';
import { CompleteTaskButton } from '../components/CompleteTaskButton';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; priority?: string; sort?: string }>;
}) {
  const { project: projectFilter, priority: priorityFilter, sort = 'priority' } = await searchParams;

  const projects = await prisma.proyecto.findMany({
    include: {
      tasks: {
        where: { status: { not: 'DONE' } },
      },
      nextActionTask: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const today = startOfDay(new Date());
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const allOpenTasks = projects.flatMap((p) => p.tasks);
  const tasksToday = allOpenTasks.filter(
    (t) => t.plannedFor && startOfDay(t.plannedFor).getTime() === today.getTime()
  );
  const upcomingDueTasks = allOpenTasks.filter(
    (t) => t.dueDate && t.dueDate >= today && t.dueDate < in7Days
  );
  // Sprint 4.4: vista de agenda — mismas tareas que ya cuenta la tarjeta
  // "Próx. fechas límite (7d)" (Sprint 9.4), pero como lista con fecha y
  // proyecto. Necesita el nombre del proyecto de cada tarea, que `tasks`
  // (incluido en `projects.tasks`) no trae — se busca en `projects` por id.
  const agendaTasks = [...upcomingDueTasks].sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  let nextActions = projects.filter((p) => p.nextActionTask);

  if (projectFilter) nextActions = nextActions.filter((p) => p.id === projectFilter);
  if (priorityFilter) nextActions = nextActions.filter((p) => p.nextActionTask!.priority === priorityFilter);

  if (sort === 'project') {
    nextActions = [...nextActions].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'dueDate') {
    nextActions = [...nextActions].sort((a, b) => {
      const da = a.nextActionTask!.dueDate;
      const db_ = b.nextActionTask!.dueDate;
      if (!da && !db_) return 0;
      if (!da) return 1;
      if (!db_) return -1;
      return da.getTime() - db_.getTime();
    });
  } else {
    nextActions = [...nextActions].sort((a, b) => byPriorityAndDueDate(a.nextActionTask!, b.nextActionTask!));
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <a
            href="/projects"
            className="bg-gray-800 hover:bg-gray-700 transition-colors p-4 rounded-lg flex flex-col items-center"
          >
            <div className="text-3xl font-bold text-primary-500">{projects.length}</div>
            <p className="text-sm text-gray-400">Proyectos totales</p>
          </a>
          <a
            href="/projects?estado=activo"
            className="bg-gray-800 hover:bg-gray-700 transition-colors p-4 rounded-lg flex flex-col items-center"
          >
            <div className="text-3xl font-bold text-success-500">
              {projects.filter((p) => p.status === 'ACTIVE').length}
            </div>
            <p className="text-sm text-gray-400">Activos</p>
          </a>
          <a
            href="/tasks?estado=abiertas"
            className="bg-gray-800 hover:bg-gray-700 transition-colors p-4 rounded-lg flex flex-col items-center"
          >
            <div className="text-3xl font-bold text-warning-500">{allOpenTasks.length}</div>
            <p className="text-sm text-gray-400">Tareas abiertas</p>
          </a>
          <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
            <div className="text-3xl font-bold text-primary-500">{tasksToday.length}</div>
            <p className="text-sm text-gray-400">Tareas de hoy</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
            <div className="text-3xl font-bold text-warning-500">{upcomingDueTasks.length}</div>
            <p className="text-sm text-gray-400">Próx. fechas límite (7d)</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
            <div className="text-3xl font-bold text-gray-300">
              {projects.filter((p) => p.status === 'COMPLETED').length}
            </div>
            <p className="text-sm text-gray-400">Completados</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Siguientes acciones</h2>
          <DashboardFilters projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
          {nextActions.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin resultados para este filtro.</p>
          ) : (
            <div className="space-y-2">
              {nextActions.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 transition-colors p-3 rounded-lg gap-3"
                >
                  <a href={`/projects/${project.id}`} className="flex-1 min-w-0">
                    <span className="text-primary-500">→ {project.nextActionTask!.title}</span>
                    <span className="text-gray-500 text-sm ml-2">({project.name})</span>
                  </a>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge badge-${project.nextActionTask!.priority.toLowerCase()}`}>
                      {project.nextActionTask!.priority}
                    </span>
                    <CompleteTaskButton
                      taskId={project.nextActionTask!.id}
                      status={project.nextActionTask!.status}
                      returnTo="/dashboard"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {agendaTasks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Agenda — Próximos 7 días</h2>
            <div className="space-y-2">
              {agendaTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 transition-colors p-3 rounded-lg gap-3"
                >
                  <a href={task.projectId ? `/projects/${task.projectId}` : '/tasks'} className="flex-1 min-w-0">
                    <span>{task.title}</span>
                    {task.projectId && (
                      <span className="text-gray-500 text-sm ml-2">({projectNameById.get(task.projectId)})</span>
                    )}
                  </a>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="badge bg-gray-700">{task.dueDate!.toLocaleDateString()}</span>
                    <CompleteTaskButton taskId={task.id} status={task.status} returnTo="/dashboard" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <p className="text-gray-500">
            No hay proyectos todavía. Ve a{' '}
            <a href="/projects" className="text-primary-500 hover:underline">
              Proyectos
            </a>{' '}
            para crear el primero.
          </p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <a
                key={project.id}
                href={`/projects/${project.id}`}
                className="block bg-gray-800 hover:bg-gray-700 transition-colors p-4 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    {project.nextAction && (
                      <p className="text-primary-500 text-sm mt-1">→ {project.nextAction}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className={`badge badge-${project.priority.toLowerCase()}`}>{project.priority}</span>
                      <span className={`badge badge-${project.status.toLowerCase()}`}>{project.status}</span>
                      <span className="badge bg-gray-700">{project.progress}%</span>
                      <span className="badge bg-gray-700">
                        {project.tasks.length} tarea{project.tasks.length !== 1 ? 's' : ''} abierta{project.tasks.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
