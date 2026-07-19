'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTaskStatus, updateTaskDueDate, updateTaskReminderPreset, deleteTask } from '@/app/actions';
import { quickCyclePriority, quickCycleStatus } from '@/app/actions/quick-create';
import { nextPriority } from '@/app/lib/priority';
import { nextStatus } from '@/app/lib/status';
import { ConfirmButton } from './ConfirmButton';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: Date | null;
  reminderPreset?: string;
  project: { id: string; name: string } | null;
  pending?: boolean;
};

const REMINDER_OPTIONS = [
  { value: 'DEFAULT', label: '3 y 5 días' },
  { value: 'FIVE_DAYS', label: '5 días' },
  { value: 'THREE_DAYS', label: '3 días' },
  { value: 'ONE_DAY', label: '1 día' },
  { value: 'NONE', label: 'Sin recordatorio' },
];

// Tarjeta de tarea individual (Sprint 9.1): extraída de TaskBoard.tsx para
// reusarla tal cual en la lista general (/tasks) y en el detalle de
// proyecto (/projects/[id]), sin duplicar el JSX de status/priority/delete.
// `showProject` oculta el badge de proyecto cuando ya es obvio por contexto
// (ej. dentro del detalle de un proyecto específico). `returnTo` (Sprint 9.1)
// se reenvía a los Server Actions para que redirijan/revaliden la página
// correcta cuando esta tarjeta se usa fuera de /tasks (ej. /projects/[id]);
// sin él, cae al default /tasks de cada acción (retrocompatible).
export function TaskCard({
  task,
  showProject = true,
  returnTo,
}: {
  task: Task;
  showProject?: boolean;
  returnTo?: string;
}) {
  const router = useRouter();

  // Guard anti doble-submit (mismo patrón useRef que TaskBoard.tsx, Sprint
  // 7.3): updateTaskDueDate/updateTaskReminderPreset hacen un findUnique +
  // llamada de red a Calendar antes de escribir el eventId resultante — dos
  // invocaciones casi simultáneas del mismo form pueden leer el mismo
  // eventId viejo en paralelo y crear un evento duplicado en Calendar
  // (hallazgo del reviewer, Sprint 4.2). Cada TaskCard es una instancia por
  // tarea, así que el ref no se comparte entre tarjetas distintas.
  const dueDateSubmittingRef = useRef(false);
  const [dueDateSubmitting, setDueDateSubmitting] = useState(false);
  const reminderSubmittingRef = useRef(false);
  const [reminderSubmitting, setReminderSubmitting] = useState(false);

  // Sesión de mejoras de UX, Parte 5a/5b/5c: prioridad, estado y "completar"
  // como controles cíclicos/directos con optimistic UI local (architect:
  // TaskCard no tiene estado propio hoy, cada tarjeta es independiente, no
  // hace falta useOptimistic a nivel del padre).
  //
  // Mutex COMPARTIDO entre los 3 controles (hallazgo bloqueante del
  // reviewer): con 3 refs independientes, un clic en "✓ Completar" y casi
  // al mismo tiempo en el badge de estado podían dispararse en paralelo —
  // ambos llaman a updateTaskStatus, y el que calculó su `status` de
  // partida ANTES de que el otro completara (closure con el valor viejo)
  // podía sobrescribir DONE con un estado anterior después de que el
  // evento de Calendar ya se hubiera borrado (Sprint 4.2). Un solo ref
  // deshabilita los 3 controles mientras cualquiera está en vuelo.
  const taskMutatingRef = useRef(false);
  const [taskMutating, setTaskMutating] = useState(false);

  const [optimisticPriority, setOptimisticPriority] = useState<string | null>(null);
  const priority = optimisticPriority ?? task.priority;
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const status = optimisticStatus ?? task.status;

  // El valor optimista NO se limpia apenas termina la petición: router.refresh()
  // solo AGENDA el refetch del RSC, no espera a que el payload nuevo llegue.
  // Limpiar en el `finally` inmediato causaba un "rebote" visible (hallazgo
  // moderado del reviewer): el badge mostraba el valor nuevo, volvía un
  // instante al viejo (porque `task.priority` prop todavía no había
  // cambiado) y recién después saltaba al confirmado. En vez de eso, se
  // limpia cuando el prop real (`task.priority`/`task.status`) cambia —
  // momento en que sabemos que el valor confirmado del server ya llegó.
  useEffect(() => {
    setOptimisticPriority(null);
  }, [task.priority]);
  useEffect(() => {
    setOptimisticStatus(null);
  }, [task.status]);

  async function handlePriorityClick() {
    if (taskMutatingRef.current) return;
    taskMutatingRef.current = true;
    setTaskMutating(true);
    const next = nextPriority(priority);
    setOptimisticPriority(next);
    try {
      await quickCyclePriority(task.id, priority);
      router.refresh();
    } catch (error) {
      console.error('[TaskCard] Error avanzando prioridad:', error);
      setOptimisticPriority(null);
    } finally {
      taskMutatingRef.current = false;
      setTaskMutating(false);
    }
  }

  async function handleStatusClick() {
    if (taskMutatingRef.current) return;
    taskMutatingRef.current = true;
    setTaskMutating(true);
    const next = nextStatus(status);
    setOptimisticStatus(next);
    try {
      await quickCycleStatus(task.id, status, returnTo);
      router.refresh();
    } catch (error) {
      console.error('[TaskCard] Error avanzando estado:', error);
      setOptimisticStatus(null);
    } finally {
      taskMutatingRef.current = false;
      setTaskMutating(false);
    }
  }

  async function handleCompleteClick() {
    if (taskMutatingRef.current) return;
    taskMutatingRef.current = true;
    setTaskMutating(true);
    setOptimisticStatus('DONE');
    const fd = new FormData();
    fd.set('id', task.id);
    fd.set('status', 'DONE');
    if (returnTo) fd.set('returnTo', returnTo);
    try {
      await updateTaskStatus(fd);
      router.refresh();
    } catch (e: any) {
      if (e?.digest?.startsWith('NEXT_REDIRECT')) return;
      console.error('[TaskCard] Error completando tarea:', e);
      setOptimisticStatus(null);
    } finally {
      taskMutatingRef.current = false;
      setTaskMutating(false);
    }
  }

  async function handleDueDateChange(formData: FormData) {
    if (dueDateSubmittingRef.current) return;
    dueDateSubmittingRef.current = true;
    setDueDateSubmitting(true);
    try {
      await updateTaskDueDate(formData);
    } catch (e: any) {
      if (e?.digest?.startsWith('NEXT_REDIRECT')) return;
    } finally {
      dueDateSubmittingRef.current = false;
      setDueDateSubmitting(false);
    }
  }

  async function handleReminderChange(formData: FormData) {
    if (reminderSubmittingRef.current) return;
    reminderSubmittingRef.current = true;
    setReminderSubmitting(true);
    try {
      await updateTaskReminderPreset(formData);
    } catch (e: any) {
      if (e?.digest?.startsWith('NEXT_REDIRECT')) return;
    } finally {
      reminderSubmittingRef.current = false;
      setReminderSubmitting(false);
    }
  }

  return (
    <div
      data-task-id={task.id}
      data-task-priority={task.priority}
      className={`bg-gray-800 p-4 rounded-lg ${task.pending ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{task.title}</h3>
            {status === 'DONE' && <span className="text-green-400 text-sm">✓ Completada</span>}
            {task.pending && <span className="text-gray-500 text-xs">Guardando…</span>}
          </div>
          {task.description && <p className="text-gray-400 text-sm mt-1">{task.description}</p>}
          <div className="flex gap-2 mt-2 flex-wrap items-center">
            {/* Sesión de mejoras de UX, Parte 5a: badge cíclico en vez de
                dropdown — clic rota LOW→MEDIUM→HIGH→CRITICAL→LOW. */}
            <button
              type="button"
              onClick={handlePriorityClick}
              disabled={task.pending || taskMutating}
              title="Clic para avanzar la prioridad"
              className={`badge badge-${priority.toLowerCase()} transition-colors duration-300 cursor-pointer disabled:cursor-wait disabled:opacity-70`}
            >
              {priority}
            </button>
            {/* Parte 5b: mismo patrón cíclico para estado (ciclo completo del
                enum: TODO→IN_PROGRESS→WAITING→DONE→TODO). */}
            <button
              type="button"
              onClick={handleStatusClick}
              disabled={task.pending || taskMutating}
              title="Clic para avanzar el estado"
              className={`badge badge-${status.toLowerCase()} transition-colors duration-300 cursor-pointer disabled:cursor-wait disabled:opacity-70`}
            >
              {status}
            </button>
            {!task.pending && (
              <form action={handleDueDateChange} className="inline-block">
                <input type="hidden" name="id" value={task.id} />
                {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                <input
                  type="date"
                  name="dueDate"
                  disabled={dueDateSubmitting}
                  defaultValue={task.dueDate ? task.dueDate.toISOString().slice(0, 10) : ''}
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
              </form>
            )}
            {!task.pending && (
              // UX tareas v2: etiqueta visible "Recordatorios Calendar:" + tooltip
              // (antes era un dropdown suelto sin contexto). La lógica no cambia.
              <form action={handleReminderChange} className="inline-flex items-center gap-1">
                <input type="hidden" name="id" value={task.id} />
                {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                <label
                  htmlFor={`reminder-${task.id}`}
                  className="text-gray-400 text-xs"
                  title="Recordatorios que Google Calendar creará para esta tarea (solo si tiene proyecto y fecha límite)."
                >
                  Recordatorios Calendar:
                </label>
                <select
                  id={`reminder-${task.id}`}
                  name="reminderPreset"
                  disabled={reminderSubmitting}
                  defaultValue={task.reminderPreset ?? 'DEFAULT'}
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  title="Recordatorios en Google Calendar (requiere proyecto y fecha límite)."
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {REMINDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </form>
            )}
            {showProject && (
              task.project ? (
                <a href={`/projects/${task.project.id}`} className="badge bg-gray-700 hover:bg-gray-600">
                  {task.project.name}
                </a>
              ) : (
                <span className="badge bg-gray-700">Sin proyecto</span>
              )
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {/* Parte 5c: atajo compacto a DONE (reusa updateTaskStatus, mismo
              efecto de borrar el evento de Calendar que Sprint 4.2 — no se
              duplica esa lógica). Oculto si ya está completada: la señal
              "✓ Completada" de arriba ya cubre ese estado, no hace falta
              repetir el control. */}
          {status !== 'DONE' && !task.pending && (
            <button
              type="button"
              onClick={handleCompleteClick}
              disabled={taskMutating}
              title="Completar tarea"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-700 hover:bg-success-500 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              ✓
            </button>
          )}
          <form action={deleteTask}>
            <input type="hidden" name="id" value={task.id} />
            {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
            <ConfirmButton className="text-danger-500 hover:text-white text-sm" confirmMessage="¿Eliminar esta tarea?">
              Eliminar
            </ConfirmButton>
          </form>
        </div>
      </div>
    </div>
  );
}
