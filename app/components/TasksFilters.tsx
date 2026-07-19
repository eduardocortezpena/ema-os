'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type Project = { id: string; name: string };

// Filtros de /tasks (UX tareas v2) vía URL searchParams — mismo patrón que
// DashboardFilters: cada select navega con router.push actualizando solo su
// parámetro y preservando los demás. Sin estado global nuevo; la fuente de
// verdad es la URL, leída server-side por tasks/page.tsx.
export function TasksFilters({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/tasks?${params.toString()}`);
  }

  const estado = searchParams.get('estado') ?? 'abiertas';
  const orden = searchParams.get('orden') ?? 'prioridad';
  const dir = searchParams.get('dir') ?? 'asc';
  const hasFiltros =
    !!searchParams.get('proyecto') ||
    !!searchParams.get('prioridad') ||
    estado !== 'abiertas' ||
    orden !== 'prioridad' ||
    dir !== 'asc';

  const selectCls =
    'bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      <select
        value={searchParams.get('proyecto') ?? ''}
        onChange={(e) => updateParam('proyecto', e.target.value)}
        className={selectCls}
      >
        <option value="">Todos los proyectos</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <select
        value={searchParams.get('prioridad') ?? ''}
        onChange={(e) => updateParam('prioridad', e.target.value)}
        className={selectCls}
      >
        <option value="">Toda prioridad</option>
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
      <select
        value={estado}
        onChange={(e) => updateParam('estado', e.target.value)}
        className={selectCls}
      >
        <option value="abiertas">Abiertas</option>
        <option value="completadas">Completadas</option>
        <option value="todas">Todas</option>
      </select>
      <select
        value={orden}
        onChange={(e) => updateParam('orden', e.target.value)}
        className={selectCls}
      >
        <option value="prioridad">Ordenar: prioridad</option>
        <option value="vencimiento">Ordenar: vencimiento</option>
        <option value="creacion">Ordenar: creación</option>
      </select>
      <select
        value={dir}
        onChange={(e) => updateParam('dir', e.target.value)}
        className={selectCls}
        title="Dirección del orden (aplica a vencimiento y creación; prioridad es fija)"
      >
        <option value="asc">Ascendente</option>
        <option value="desc">Descendente</option>
      </select>
      {hasFiltros && (
        <button
          type="button"
          onClick={() => router.push('/tasks')}
          className="text-gray-500 hover:text-gray-300 text-sm px-2"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
