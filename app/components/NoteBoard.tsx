'use client';

import { useOptimistic, useRef, useState } from 'react';
import { createNote, updateNote, deleteNote } from '@/app/actions/notes';
import { ConfirmButton } from './ConfirmButton';
import { MarkdownEditor } from './MarkdownEditor';
import { renderMarkdown } from '@/app/lib/markdown';

type Project = { id: string; name: string };
type Note = {
  id: string;
  title: string;
  content: string;
  driveFileId: string | null;
  project: { name: string };
  pending?: boolean;
};

// Optimistic UI (Sprint 7.3): mismo patrón que TaskBoard — la nota aparece
// al instante con el contenido tal cual se escribió (no hace falta releerlo
// de disco/Drive, ya lo tenemos del propio formulario), y desaparece sola si
// el Server Action falla porque la lista real nunca la incluyó.
export function NoteBoard({ notes, projects }: { notes: Note[]; projects: Project[] }) {
  const [optimisticNotes, addOptimisticNote] = useOptimistic(notes, (state, newNote: Note) => [
    newNote,
    ...state,
  ]);
  const [error, setError] = useState<string | null>(null);
  // Guard contra doble-submit — useRef (síncrono), no useState. Ver
  // TaskBoard.tsx para el porqué (useState no bastó, verificado con un
  // doble-submit real de 50ms).
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  async function formAction(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    const title = formData.get('title')?.toString().trim();
    const content = formData.get('content')?.toString() ?? '';
    const projectId = formData.get('projectId')?.toString() || '';
    const project = projects.find((p) => p.id === projectId) ?? null;

    if (title && projectId && project) {
      addOptimisticNote({
        id: `optimistic-${Date.now()}`,
        title,
        content,
        driveFileId: null,
        project: { name: project.name },
        pending: true,
      });
    }

    try {
      await createNote(formData);
    } catch (e: any) {
      if (e?.digest?.startsWith('NEXT_REDIRECT')) return;
      setError('Error creando nota. Intenta de nuevo.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {error && (
          <p className="bg-danger-500/10 border border-danger-500 text-danger-500 rounded px-3 py-2 mb-4 text-sm">
            {error}
          </p>
        )}
        <div className="space-y-4">
          {optimisticNotes.length === 0 ? (
            <p className="text-gray-500">No hay notas todavía. ¡Crea una abajo!</p>
          ) : (
            optimisticNotes.map((note) => (
              <div key={note.id} className={`bg-gray-800 p-4 rounded-lg ${note.pending ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{note.title}</h3>
                      {note.pending && <span className="text-gray-500 text-xs">Guardando…</span>}
                    </div>
                    <div
                      className="text-gray-300 text-sm mt-1"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
                    />
                    <div className="flex gap-2 mt-2">
                      <span className="badge bg-gray-700 inline-block">{note.project.name}</span>
                      {note.driveFileId && <span className="badge bg-gray-700 inline-block">en Drive</span>}
                    </div>
                  </div>
                  {!note.pending && (
                    <form action={deleteNote}>
                      <input type="hidden" name="id" value={note.id} />
                      <ConfirmButton className="text-danger-500 hover:text-white text-sm" confirmMessage="¿Eliminar esta nota?">
                        Eliminar
                      </ConfirmButton>
                    </form>
                  )}
                </div>

                {!note.pending && (
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
                        <MarkdownEditor name="content" defaultValue={note.content} />
                      </div>
                      <button type="submit" className="bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors text-sm">
                        Guardar cambios
                      </button>
                    </form>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg h-fit">
        <h2 className="text-lg font-semibold mb-4">Nueva Nota</h2>
        <form action={formAction} className="space-y-4">
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
            disabled={projects.length === 0 || submitting}
            className="bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors w-full disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creando…' : 'Crear Nota'}
          </button>
        </form>
      </div>
    </div>
  );
}
