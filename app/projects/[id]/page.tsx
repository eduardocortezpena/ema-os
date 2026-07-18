import { notFound } from 'next/navigation';
import { prisma } from '@/app/lib/db';
import { updateProject, setNextAction } from '@/app/actions';
import { AutoSubmitSelect } from '@/app/components/AutoSubmitSelect';
import { ConfirmButton } from '@/app/components/ConfirmButton';
import { ProjectTaskList } from '@/app/components/ProjectTaskList';

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const project = await prisma.proyecto.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { title: 'asc' } },
      nextActionTask: true,
      archivos: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!project) notFound();

  // Plantillas disponibles para este proyecto: las globales (projectId null)
  // más las específicas del proyecto. Se pasan a ProjectTaskList para que
  // cada tarea pueda generar documentos (Fase 5/6 UI).
  const templates = await prisma.documentTemplate.findMany({
    where: { OR: [{ projectId: null }, { projectId: id }] },
    select: { id: true, name: true, docType: true },
    orderBy: { name: 'asc' },
  });

  // Sesión de mejoras de UX, Parte 4: la nota de contexto (kind='NOTE') ya
  // no se renderiza aquí — se conserva íntegra en Drive + Archivo (índice),
  // será el contexto de futuros agentes organizadores. app/actions/notes.ts
  // sigue intacto como superficie programática para leerla/escribirla.
  const archivosDeProyecto = project.archivos.filter((a) => a.kind === 'FILE');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-4 max-w-4xl">
        <a href="/projects" className="text-gray-500 hover:text-gray-300 text-sm">← Proyectos</a>

        {error && (
          <p className="bg-danger-500/10 border border-danger-500 text-danger-500 rounded px-3 py-2 my-4 text-sm">
            {error}
          </p>
        )}

        <div className="flex items-start justify-between mt-2 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && <p className="text-gray-400 text-sm mt-1">{project.description}</p>}
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={`badge badge-${project.priority.toLowerCase()}`}>{project.priority}</span>
              <span className={`badge badge-${project.status.toLowerCase()}`}>{project.status}</span>
              <span className="badge bg-gray-700">{project.progress}%</span>
              {project.driveFolderId && (
                <a
                  href={`https://drive.google.com/drive/folders/${project.driveFolderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="badge bg-gray-700 hover:bg-gray-600"
                >
                  Ver carpeta en Drive
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Next Action */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-sm text-gray-500 mb-2">Next Action</h2>
          {project.nextActionTask ? (
            <p className="text-primary-500 font-medium">→ {project.nextActionTask.title}</p>
          ) : (
            <p className="text-gray-500 text-sm">(ninguna)</p>
          )}
          {project.tasks.length > 0 && (
            <form action={setNextAction} className="flex items-center gap-2 mt-2">
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="returnTo" value={`/projects/${project.id}`} />
              <label className="text-xs text-gray-500">Cambiar:</label>
              <AutoSubmitSelect
                name="taskId"
                defaultValue={project.nextActionTaskId ?? ''}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                options={[
                  { value: '', label: '(ninguna)' },
                  ...project.tasks.map((t) => ({ value: t.id, label: t.title })),
                ]}
              />
            </form>
          )}
        </div>

        {/* Editar proyecto */}
        <details className="bg-gray-800 p-4 rounded-lg mb-6">
          <summary className="text-sm text-gray-400 cursor-pointer hover:text-white">Editar proyecto</summary>
          <form action={updateProject} className="space-y-3 mt-3">
            <input type="hidden" name="id" value={project.id} />
            <input type="hidden" name="returnTo" value={`/projects/${project.id}`} />
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

        {/* Tareas */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Tareas ({project.tasks.length})</h2>
          <ProjectTaskList
            projectId={project.id}
            tasks={project.tasks.map((t) => ({ ...t, project: null }))}
            templates={templates}
          />
        </div>

        {/* Archivos de Drive */}
        {archivosDeProyecto.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Archivos</h2>
            <div className="space-y-2">
              {archivosDeProyecto.map((archivo) => (
                <div key={archivo.id} className="bg-gray-800 p-2 rounded flex items-center justify-between">
                  <span>{archivo.title}</span>
                  {archivo.driveFileId && (
                    <a
                      href={`https://drive.google.com/file/d/${archivo.driveFileId}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="badge bg-gray-700 hover:bg-gray-600"
                    >
                      en Drive
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
