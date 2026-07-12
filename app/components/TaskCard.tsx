'use client';

import { updateTaskStatus, updateTaskPriority, deleteTask } from '@/app/actions';
import { ConfirmButton } from './ConfirmButton';
import { AutoSubmitSelect } from './AutoSubmitSelect';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: Date | null;
  project: { id: string; name: string } | null;
  pending?: boolean;
};

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
            {task.dueDate && (
              <span className="badge bg-gray-700">{task.dueDate.toLocaleDateString()}</span>
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
