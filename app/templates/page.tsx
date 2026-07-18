import { prisma } from '@/app/lib/db';
import { registerDocumentTemplate, deleteDocumentTemplate } from '@/app/actions/document-actions';
import { ConfirmButton } from '@/app/components/ConfirmButton';

// Página dedicada al CRUD de plantillas de documentos (Fase 5/6 UI).
// El formulario de alta antes vivía en /settings — se movió aquí para
// centralizar todo el ciclo de vida de plantillas en un solo lugar.
// Las Server Actions ya existían en document-actions.ts; esta página
// solo las consume. La acción de borrado (deleteDocumentTemplate) se
// añadió en el mismo commit que esta página para cerrar el CRUD.
export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const { error, created } = await searchParams;

  const [templates, projects] = await Promise.all([
    prisma.documentTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    }),
    prisma.proyecto.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Plantillas de documentos</h1>
        <p className="text-gray-400 text-sm mb-6">
          Registra plantillas <code className="text-gray-300">.docx</code> o{' '}
          <code className="text-gray-300">.md</code> para generar documentos automáticamente desde
          el detalle de un proyecto.
        </p>

        {error && (
          <p className="bg-danger-500/10 border border-danger-500 text-danger-500 rounded px-3 py-2 mb-4 text-sm">
            {error}
          </p>
        )}
        {created === '1' && (
          <p className="bg-success-500/10 border border-success-500 text-success-500 rounded px-3 py-2 mb-4 text-sm">
            Plantilla registrada correctamente.
          </p>
        )}

        {/* Listado */}
        <div className="rounded-lg bg-gray-800 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Plantillas registradas ({templates.length})</h2>

          {templates.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin plantillas todavía. Crea una abajo.</p>
          ) : (
            <ul className="space-y-2">
              {templates.map((t) => (
                <li
                  key={t.id}
                  className="bg-gray-700 p-3 rounded flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{t.name}</span>
                      <span
                        className={`badge ${t.docType === 'docx' ? 'badge-active' : 'badge-medium'}`}
                      >
                        {t.docType}
                      </span>
                      {t.project ? (
                        <a
                          href={`/projects/${t.project.id}`}
                          className="badge bg-gray-600 hover:bg-gray-500"
                          title="Plantilla específica de este proyecto"
                        >
                          {t.project.name}
                        </a>
                      ) : (
                        <span className="badge bg-gray-600" title="Disponible para todos los proyectos">
                          Global
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      Creada {t.createdAt.toLocaleDateString('es-MX')} · archivo:{' '}
                      <code className="text-gray-300">{t.path}</code>
                    </p>
                  </div>
                  <form action={deleteDocumentTemplate}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="returnTo" value="/templates?deleted=1" />
                    <ConfirmButton
                      className="text-danger-500 hover:text-white text-sm"
                      confirmMessage={`¿Eliminar la plantilla "${t.name}"? También se borrará el archivo del disco.`}
                    >
                      Eliminar
                    </ConfirmButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Formulario de alta (movido desde /settings) */}
        <div className="rounded-lg bg-gray-800 p-6">
          <h2 className="text-xl font-semibold mb-4">Registrar nueva plantilla</h2>
          <form action={registerDocumentTemplate} className="space-y-4">
            <input type="hidden" name="returnTo" value="/templates" />
            <div>
              <label className="block text-sm text-gray-300 mb-1">Nombre *</label>
              <input
                type="text"
                name="name"
                required
                className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
                placeholder="Ej: Reporte de proyecto"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Tipo *</label>
              <select name="docType" required className="w-full bg-gray-700 rounded px-3 py-2 text-sm">
                <option value="docx">DOCX (.docx) — se rellena con docxtemplater</option>
                <option value="md">Markdown (.md) — se convierte a PDF</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Proyecto (opcional)
              </label>
              <select name="projectId" className="w-full bg-gray-700 rounded px-3 py-2 text-sm">
                <option value="">Global — disponible para todos los proyectos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-xs mt-1">
                Si eliges un proyecto, la plantilla solo aparecerá al generar documentos en ese
                proyecto. Las globales aparecen en todos.
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Archivo de plantilla *</label>
              <input
                type="file"
                name="template"
                required
                accept=".docx,.md"
                className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-primary-500 file:text-white hover:file:bg-primary-600"
              />
              <p className="text-gray-500 text-xs mt-1">
                DOCX: usa placeholders <code>{'{nombre}'}</code> que docxtemplater reemplazará. ·
                MD: usa <code>{'{{nombre}}}'}</code> (doble llave) que el generador reemplaza antes
                de convertir a PDF.
              </p>
            </div>
            <button
              type="submit"
              className="inline-block bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors text-sm"
            >
              Registrar plantilla
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
