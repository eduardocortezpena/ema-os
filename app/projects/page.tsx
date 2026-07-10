import { prisma } from '../../lib/prisma';

export default async function ProjectsPage() {
  return (
    <div className="flex flex-1 flex-col items-start justify-start p-8 w-full">
      <main className="flex-1 w-full max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-50 mb-6">
          Proyectos
        </h1>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300">
            Aquí se mostrarán tus proyectos administrados.
          </p>
        </div>
      </main>
    </div>
  );
}