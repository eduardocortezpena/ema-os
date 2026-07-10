import { prisma } from '@/app/lib/prisma';
import { createProject, updateProject, deleteProject } from '../actions';
import { ConfirmButton } from '../components/ConfirmButton';

export default async function ProjectsPage() {
  const projects = await prisma.proyecto.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Proyectos</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {projects.length === 0 ? (
                <p className="text-gray-500">No hay proyectos todavía. ¡Crea uno abajo!</p>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        {project.description && (
                          <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                        )}
                        {project.nextAction && (
                          <p className="text-primary-500 text-sm mt-1">→ {project.nextAction}</p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className={`badge badge-${project.priority.toLowerCase()}`}>{project.priority}</span>
                          <span className={`badge badge-${project.status.toLowerCase()}`}>{project.status}</span>
                          <span className="badge bg-gray-700">{project.progress}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <form action={deleteProject}>
                          <input type="hidden" name="id" value={project.id} />
                          <ConfirmButton
                            className="text-danger-500 hover:text-white text-sm"
                            confirmMessage="¿Eliminar este proyecto?"
                          >
                            Eliminar
                          </ConfirmButton>
                        </form>
                      </div>
                    </div>

                    <details className="mt-3">
                      <summary className="text-sm text-gray-400 cursor-pointer hover:text-white">Editar</summary>
                      <form action={updateProject} className="space-y-3 mt-3">
                        <input type="hidden" name="id" value={project.id} />
                        <div>
                          <label className="block text-sm mb-1">Nombre *</label>
                          <input type="text" name="name" required defaultValue={project.name}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Descripción</label>
                          <textarea name="description" defaultValue={project.description ?? ''}
                            className="w-full h-16 bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Siguiente paso</label>
                          <input type="text" name="nextAction" defaultValue={project.nextAction ?? ''}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-sm mb-1">Prioridad</label>
                            <select name="priority" defaultValue={project.priority}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                              <option value="LOW">Low</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HIGH">High</option>
                              <option value="CRITICAL">Critical</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm mb-1">Estado</label>
                            <select name="status" defaultValue={project.status}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                              <option value="PLANNING">Planning</option>
                              <option value="ACTIVE">Active</option>
                              <option value="PAUSED">Paused</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm mb-1">Progreso %</label>
                            <input type="number" name="progress" min={0} max={100} defaultValue={project.progress}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                          </div>
                        </div>
                        <button type="submit" className="bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors text-sm">
                          Guardar cambios
                        </button>
                      </form>
                    </details>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg h-fit">
            <h2 className="text-lg font-semibold mb-4">Nuevo Proyecto</h2>
            <form action={createProject} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Nombre *</label>
                <input type="text" name="name" required
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm mb-1">Descripción</label>
                <textarea name="description"
                  className="w-full h-20 bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm mb-1">Siguiente paso</label>
                <input type="text" name="nextAction"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm mb-1">Prioridad</label>
                <select name="priority" defaultValue="LOW"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Estado</label>
                <select name="status" defaultValue="PLANNING"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <button type="submit" className="bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors w-full">
                Crear Proyecto
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
