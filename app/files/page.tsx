import { prisma } from '@/app/lib/db';
import { uploadFile } from '../actions/files';

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const projects = await prisma.proyecto.findMany({
    include: { archivos: { orderBy: { createdAt: 'desc' } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Archivos</h1>
        </div>

        {error && (
          <p className="bg-danger-500/10 border border-danger-500 text-danger-500 rounded px-3 py-2 mb-4 text-sm">
            {error}
          </p>
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
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  {project.driveFolderId && (
                    <a
                      href={`https://drive.google.com/drive/folders/${project.driveFolderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:underline text-xs"
                    >
                      Ver carpeta en Drive
                    </a>
                  )}
                </div>
                <p className="text-gray-500 text-xs mb-3">files/{project.id}/</p>

                {project.archivos.length === 0 ? (
                  <p className="text-gray-500 text-sm mb-3">Sin archivos indexados todavía.</p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {project.archivos.map((archivo) => (
                      <div key={archivo.id} className="bg-gray-900 p-2 rounded flex items-center justify-between">
                        <span>{archivo.title}</span>
                        <div className="flex gap-2 items-center">
                          <span className="badge bg-gray-700">{archivo.kind}</span>
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
                      </div>
                    ))}
                  </div>
                )}

                <form action={uploadFile} className="flex items-center gap-2 border-t border-gray-700 pt-3">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input
                    type="file"
                    name="file"
                    required
                    className="flex-1 text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600"
                  />
                  <button
                    type="submit"
                    className="bg-primary-500 px-3 py-1.5 rounded hover:bg-primary-600 transition-colors text-sm whitespace-nowrap"
                  >
                    Subir archivo
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
