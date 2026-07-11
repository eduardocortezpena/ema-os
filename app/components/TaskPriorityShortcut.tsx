'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { quickCyclePriority } from '@/app/actions/quick-create';
import { nextPriority } from '@/app/lib/priority';
import { isTypingTarget } from '@/app/lib/keyboard';

// Atajo "P" (Sprint 7.2): con el mouse sobre una tarjeta de tarea en /tasks,
// presionar P avanza su prioridad al siguiente valor del ciclo. Usa
// delegación de eventos sobre `[data-task-id]` en vez de envolver cada fila
// en un componente cliente — la página sigue siendo un Server Component.
export function TaskPriorityShortcut() {
  const router = useRouter();
  const hoveredRef = useRef<{ id: string; priority: string } | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    function onMouseOver(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest?.('[data-task-id]') as HTMLElement | null;
      if (el) {
        hoveredRef.current = { id: el.dataset.taskId!, priority: el.dataset.taskPriority! };
      }
    }
    function onMouseOut(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest?.('[data-task-id]') as HTMLElement | null;
      const related = (e.relatedTarget as HTMLElement)?.closest?.('[data-task-id]');
      if (el && el !== related) hoveredRef.current = null;
    }
    async function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() !== 'p') return;
      if (isTypingTarget(e.target)) return;
      const hovered = hoveredRef.current;
      // Ignorar filas optimistas (Sprint 7.3, TaskBoard): todavía no tienen
      // id real en la DB, así que updateTaskPriority fallaría con un error
      // confuso para el usuario.
      if (!hovered || busyRef.current || hovered.id.startsWith('optimistic-')) return;

      busyRef.current = true;
      try {
        await quickCyclePriority(hovered.id, hovered.priority);
        // Actualización optimista local: si el mouse no se mueve tras el
        // refresh, el navegador no vuelve a disparar "mouseover" y el ref se
        // quedaría con la prioridad vieja — una segunda "P" recalcularía el
        // mismo siguiente valor en vez de avanzar. Se actualiza aquí para
        // que presiones repetidas sin mover el mouse sigan el ciclo completo.
        if (hoveredRef.current?.id === hovered.id) {
          hoveredRef.current = { id: hovered.id, priority: nextPriority(hovered.priority) };
        }
        router.refresh();
      } catch (error) {
        console.error('[TaskPriorityShortcut] Error avanzando prioridad:', error);
      } finally {
        busyRef.current = false;
      }
    }

    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [router]);

  return null;
}
