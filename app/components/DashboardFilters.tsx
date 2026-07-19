'use client';

import { useRouter, useSearchParams } from 'next/navigation';

// Filtro/orden de "Siguientes acciones" (Sprint 9.4) vía query params — sin
// librerías nuevas, consistente con el patrón SSR del resto de la app. Cada
// select navega con router.push actualizando solo su propio parámetro,
// preservando los demás filtros activos. UX tareas v2: el filtro de proyecto
// se quitó (redundante con /projects); quedan prioridad y orden.
export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <select
        value={searchParams.get('priority') ?? ''}
        onChange={(e) => updateParam('priority', e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Toda prioridad</option>
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
      <select
        value={searchParams.get('sort') ?? 'priority'}
        onChange={(e) => updateParam('sort', e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="priority">Ordenar: prioridad</option>
        <option value="project">Ordenar: proyecto</option>
        <option value="dueDate">Ordenar: fecha límite</option>
      </select>
      {searchParams.get('priority') && (
        <button
          type="button"
          onClick={() => {
            // Solo limpia priority — sort es preferencia de visualización,
            // no un filtro que oculte resultados, así que se preserva.
            const sortValue = searchParams.get('sort');
            router.push(sortValue ? `/dashboard?sort=${sortValue}` : '/dashboard');
          }}
          className="text-gray-500 hover:text-gray-300 text-sm px-2"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
