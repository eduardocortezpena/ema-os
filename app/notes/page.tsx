import { prisma } from '@/app/lib/db';
import { createNote, updateNote, deleteNote, getNoteContent } from '../actions/notes';
import { ConfirmButton } from '../components/ConfirmButton';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { renderMarkdown } from '@/app/lib/markdown';

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [notes, projects] = await Promise.all([
    prisma.archivo.findMany({
      where: { kind: 'NOTE' },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.proyecto.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  // El contenido vive en el .md (local o Drive), no en la DB: cargarlo por nota.
  const contents = await Promise.all(notes.map((n) => getNoteContent(n.id)));

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notas</h1>
        </div>

        {error && (
          <p className="bg-danger-500/10 border border-danger-500 text-danger-500 rounded px-3 py-2 mb-4 text-sm">
            {error}
          </p>
        )}

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
                notes.map((note, i) => (
                  <div key={note.id} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{note.title}</h3>
                        <div
                          className="text-gray-300 text-sm mt-1"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(contents[i]) }}
                        />
                        <div className="flex gap-2 mt-2">
                          <span className="badge bg-gray-700 inline-block">{note.project.name}</span>
                          {note.driveFileId && <span className="badge bg-gray-700 inline-block">en Drive</span>}
                        </div>
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
                          <label className="block text-sm mb-1">Contenido (Markdown)</label>
                          <MarkdownEditor name="content" defaultValue={contents[i]} />
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
                <label className="block text-sm mb-1">Contenido (Markdown)</label>
                <MarkdownEditor name="content" />
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
