import { headers } from 'next/headers';
import { buildAuthUrl, isDriveConnected } from '@/app/lib/google-drive-auth';
import { migrateLegacyNotes } from '@/app/actions/notes';

export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<{ drive?: string; error?: string; count?: string }>;
}) {
  const { drive, error, count } = await searchParams;
  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const redirectUri = `http://${host}/settings/drive/callback`;

  const connected = await isDriveConnected();
  let authUrl: string | null = null;
  let configError: string | null = null;
  try {
    authUrl = buildAuthUrl(redirectUri);
  } catch (e: any) {
    configError = e.message;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Configuración</h1>

        {error && (
          <p className="bg-danger-500/10 border border-danger-500 text-danger-500 rounded px-3 py-2 mb-4 text-sm">
            {error}
          </p>
        )}
        {drive === 'connected' && (
          <p className="bg-success-500/10 border border-success-500 text-success-500 rounded px-3 py-2 mb-4 text-sm">
            Google Drive conectado correctamente.
          </p>
        )}
        {drive === 'migrated' && (
          <p className="bg-success-500/10 border border-success-500 text-success-500 rounded px-3 py-2 mb-4 text-sm">
            Migración de notas antiguas completada: {count ?? 0} nota(s) movida(s) a Drive.
          </p>
        )}

        <div className="space-y-6 rounded-lg bg-gray-800 p-6 mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Google Drive</h2>
            {connected ? (
              <div className="flex items-center gap-2">
                <span className="badge badge-completed">Conectado</span>
                <span className="text-gray-400 text-sm">
                  EMA OS tiene acceso a Drive (scope drive.file) y conserva la sesión tras reiniciar.
                </span>
              </div>
            ) : configError ? (
              <p className="text-amber-400 text-sm">
                ⚠️ Falta configurar credenciales en <code>.env</code>: {configError}
              </p>
            ) : (
              <div>
                <p className="text-gray-400 text-sm mb-3">
                  Conecta tu cuenta de Google para guardar notas y archivos en Drive.
                </p>
                <a
                  href={authUrl!}
                  className="inline-block bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors text-sm"
                >
                  Conectar con Google Drive
                </a>
              </div>
            )}
          </div>

          {/* Migración disponible SIEMPRE (no gateada por Drive): si Drive no
              está conectado, el espejo degrada y las notas quedan al menos
              locales + visibles en /projects/[id] (Sprint 9.3). Ver reviewer H2. */}
          <div className="border-t border-gray-700 pt-4">
            <form action={migrateLegacyNotes}>
              <button
                type="submit"
                className="inline-block bg-gray-700 px-3 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
              >
                Migrar notas antiguas a Drive
              </button>
              <span className="text-gray-500 text-xs ml-2">
                Copia notas previas (SQLite) a archivos .md (locales + Drive si está conectado). No borra nada. Idempotente.
              </span>
            </form>
          </div>
        </div>

        <div className="space-y-6 rounded-lg bg-gray-800 p-6">
          <div>
            <h2 className="text-xl font-semibold">Preferencias</h2>
            <div className="flex flex-col">
              <div className="flex items-center justify-between p-2 rounded bg-gray-700">
                <span className="text-gray-300 mr-2">Tema</span>
                <button className="px-3 py-1 text-sm bg-primary-500 rounded hover:bg-primary-600">
                  Oscuro
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-gray-700">
              <span className="text-gray-300 mr-2">Moneda</span>
              <button className="px-3 py-1 text-sm bg-gray-600 rounded hover:bg-gray-700">
                USD
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-gray-700">
              <span className="text-gray-300 mr-2">Idioma</span>
              <button className="px-3 py-1 text-sm bg-gray-600 rounded hover:bg-gray-700">
                Español
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Información</h2>
            <p className="text-gray-300 text-sm mt-1">
              Versión: 0.1.0<br/>
              Autor: EdEma<br/>
              Tecnologías: Next.js, TypeScript, Tailwind, Prisma
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
