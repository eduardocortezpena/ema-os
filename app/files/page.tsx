import { prisma } from '@/app/lib/db';

export default async function FilesPage() {
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
                <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
                <p className="text-gray-500 text-xs mb-3">files/{project.id}/</p>
                {project.archivos.length === 0 ? (
                  <p className="text-gray-500 text-sm">Sin archivos indexados todavía.</p>
                ) : (
                  <div className="space-y-2">
                    {project.archivos.map((archivo) => (
                      <div key={archivo.id} className="bg-gray-900 p-2 rounded flex items-center justify-between">
                        <span>{archivo.title}</span>
                        <div className="flex gap-2 items-center">
                          <span className="badge bg-gray-700">{archivo.kind}</span>
                          {archivo.driveFileId && (
                            <span className="badge bg-gray-700">en Drive</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
