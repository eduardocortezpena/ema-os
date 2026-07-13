'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTaskStatus } from '@/app/actions';

// Botón compacto de "completar tarea" (Sesión con supervisión parcial,
// Parte 1): standalone, NO comparte lógica con TaskCard.tsx a propósito
// (architect: TaskCard.handleCompleteClick ya está probado en producción
// con un mutex compartido entre 3 controles — extraerlo forzaría a elegir
// entre romper ese mutex o acoplar dos componentes, arriesgando el bug de
// carrera que el reviewer ya cerró en la Sesión de mejoras de UX Parte 5).
// Mismo patrón (ref + optimistic UI + updateTaskStatus, que ya borra el
// evento de Calendar al completar — Sprint 4.2), pero aislado para usarse
// en vistas de solo lectura (dashboard, My Day) que no tienen el resto de
// controles cíclicos de TaskCard.
export function CompleteTaskButton({
  taskId,
  status,
  returnTo,
}: {
  taskId: string;
  status: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [optimisticDone, setOptimisticDone] = useState(false);

  if (status === 'DONE' || optimisticDone) return null;

  async function handleClick() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setOptimisticDone(true);
    const fd = new FormData();
    fd.set('id', taskId);
    fd.set('status', 'DONE');
    if (returnTo) fd.set('returnTo', returnTo);
    try {
      await updateTaskStatus(fd);
      router.refresh();
    } catch (e: any) {
      if (e?.digest?.startsWith('NEXT_REDIRECT')) return;
      console.error('[CompleteTaskButton] Error completando tarea:', e);
      setOptimisticDone(false);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={submitting}
      title="Completar tarea"
      className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-700 hover:bg-success-500 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait shrink-0"
    >
      ✓
    </button>
  );
}
