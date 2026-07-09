'use client';

export default function Settings() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Configuración</h1>

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