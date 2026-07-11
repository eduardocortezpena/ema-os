import { prisma } from '@/app/lib/db';
import { getNoteContent } from '../actions/notes';
import { NoteBoard } from '../components/NoteBoard';

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [notesRaw, projects] = await Promise.all([
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
  const contents = await Promise.all(notesRaw.map((n) => getNoteContent(n.id)));
  const notes = notesRaw.map((n, i) => ({ ...n, content: contents[i] }));

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

        <NoteBoard notes={notes} projects={projects} />
      </div>
    </div>
  );
}
