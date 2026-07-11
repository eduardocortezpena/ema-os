import { prisma } from '@/app/lib/db';
import { assignTaskToProject, deleteTask } from '../actions';
import { ConfirmButton } from '../components/ConfirmButton';
import { InboxCaptureForm } from '../components/InboxCaptureForm';

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [items, projects] = await Promise.all([
    prisma.tarea.findMany({
      where: { projectId: null },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.proyecto.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Inbox</h1>
        </div>

        {error && (
          <p className="bg-danger-500/10 border border-danger-500 text-danger-500 rounded px-3 py-2 mb-4 text-sm">
            {error}
          </p>
        )}

        <p className="text-gray-500 text-sm mb-4">
          Captura ideas o tareas sueltas sin pensar todavía a qué proyecto pertenecen.
          Clasifícalas cuando quieras.
        </p>

        <InboxCaptureForm />

        {items.length === 0 ? (
          <p className="text-gray-500">Inbox vacío. Captura algo arriba.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-gray-800 p-3 rounded-lg flex items-center justify-between gap-3">
                <span className="flex-1">{item.title}</span>
                <form action={assignTaskToProject} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <select
                    name="projectId"
                    required
                    defaultValue=""
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="" disabled>Elegir proyecto...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={projects.length === 0}
                    className="bg-primary-500 px-3 py-1 rounded hover:bg-primary-600 transition-colors text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    Clasificar
                  </button>
                </form>
                <form action={deleteTask}>
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmButton className="text-danger-500 hover:text-white text-sm" confirmMessage="¿Eliminar este ítem del inbox?">
                    Eliminar
                  </ConfirmButton>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
