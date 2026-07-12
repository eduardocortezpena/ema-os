'use client';

import { useRef, useState } from 'react';
import { updateTaskStatus, updateTaskPriority, updateTaskDueDate, updateTaskReminderPreset, deleteTask } from '@/app/actions';
import { ConfirmButton } from './ConfirmButton';
import { AutoSubmitSelect } from './AutoSubmitSelect';

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
            {task.status === 'DONE' && <span className="text-green-400 text-sm">✓ Completada</span>}
            {task.pending && <span className="text-gray-500 text-xs">Guardando…</span>}
          </div>
          {task.description && <p className="text-gray-400 text-sm mt-1">{task.description}</p>}
          <div className="flex gap-2 mt-2 flex-wrap items-center">
            <form action={updateTaskPriority} className="inline-block">
              <input type="hidden" name="id" value={task.id} />
              {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
              <AutoSubmitSelect
                name="priority"
                defaultValue={task.priority}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                options={[
                  { value: 'LOW', label: 'LOW' },
                  { value: 'MEDIUM', label: 'MEDIUM' },
                  { value: 'HIGH', label: 'HIGH' },
                  { value: 'CRITICAL', label: 'CRITICAL' },
                ]}
              />
            </form>
            <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status}</span>
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
              <form action={handleReminderChange} className="inline-block">
                <input type="hidden" name="id" value={task.id} />
                {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                <select
                  name="reminderPreset"
                  disabled={reminderSubmitting}
                  defaultValue={task.reminderPreset ?? 'DEFAULT'}
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
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
          <form action={updateTaskStatus} className="flex items-center gap-2">
            <input type="hidden" name="id" value={task.id} />
            {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
            <AutoSubmitSelect
              name="status"
              defaultValue={task.status}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              options={[
                { value: 'TODO', label: 'Todo' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'WAITING', label: 'Waiting' },
                { value: 'DONE', label: 'Done' },
              ]}
            />
          </form>
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
