import { prisma } from '@/app/lib/prisma';

export default async function DashboardPage() {
  const projects = await prisma.proyecto.findMany({
    include: {
      tasks: {
        where: { status: { not: 'DONE' } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
            <div className="text-3xl font-bold text-primary-500">{projects.length}</div>
            <p className="text-sm text-gray-400">Proyectos totales</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
            <div className="text-3xl font-bold text-success-500">
              {projects.filter((p) => p.status === 'ACTIVE').length}
            </div>
            <p className="text-sm text-gray-400">Activos</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
            <div className="text-3xl font-bold text-warning-500">
              {projects.reduce((sum, p) => sum + p.tasks.length, 0)}
            </div>
            <p className="text-sm text-gray-400">Tareas abiertas</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
            <div className="text-3xl font-bold text-gray-300">
              {projects.filter((p) => p.status === 'COMPLETED').length}
            </div>
            <p className="text-sm text-gray-400">Completados</p>
          </div>
        </div>

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
              <div key={project.id} className="bg-gray-800 p-4 rounded-lg">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
