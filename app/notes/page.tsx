import { prisma } from '@/app/lib/db';
import { createNote, updateNote, deleteNote } from '../actions/notes';
import { ConfirmButton } from '../components/ConfirmButton';

export default async function NotesPage() {
  const [notes, projects] = await Promise.all([
    prisma.nota.findMany({
      include: { project: true },
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
          <h1 className="text-2xl font-bold">Notas</h1>
        </div>

        {projects.length === 0 && (
          <p className="text-amber-400 mb-4">
            ⚠️ Necesitas crear un proyecto primero antes de crear notas.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-gray-500">No hay notas todavía. ¡Crea una abajo!</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{note.title}</h3>
                        <p className="text-gray-400 text-sm mt-1 whitespace-pre-wrap">{note.content}</p>
                        <span className="badge bg-gray-700 mt-2 inline-block">{note.project.name}</span>
                      </div>
                      <form action={deleteNote}>
                        <input type="hidden" name="id" value={note.id} />
                        <ConfirmButton
                          className="text-danger-500 hover:text-white text-sm"
                          confirmMessage="¿Eliminar esta nota?"
                        >
                          Eliminar
                        </ConfirmButton>
                      </form>
                    </div>

                    <details className="mt-3">
                      <summary className="text-sm text-gray-400 cursor-pointer hover:text-white">Editar</summary>
                      <form action={updateNote} className="space-y-3 mt-3">
                        <input type="hidden" name="id" value={note.id} />
                        <div>
                          <label className="block text-sm mb-1">Título *</label>
                          <input type="text" name="title" required defaultValue={note.title}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Contenido</label>
                          <textarea name="content" defaultValue={note.content}
                            className="w-full h-32 bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
            <h2 className="text-lg font-semibold mb-4">Nueva Nota</h2>
            <form action={createNote} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Título *</label>
                <input type="text" name="title" required
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm mb-1">Contenido</label>
                <textarea name="content"
                  className="w-full h-32 bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm mb-1">Proyecto *</label>
                <select name="projectId" required defaultValue=""
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="" disabled>Selecciona un proyecto...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={projects.length === 0}
                className="bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors w-full disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Crear Nota
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
