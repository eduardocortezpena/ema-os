'use client';

import { useOptimistic, useRef, useState } from 'react';
import { createTask } from '@/app/actions';
import { TaskPriorityShortcut } from './TaskPriorityShortcut';
import { TaskCard, type Task } from './TaskCard';

type Project = { id: string; name: string };

// Optimistic UI (Sprint 7.3): al crear una tarea aparece al instante (con
// opacidad reducida hasta confirmarse); si el Server Action falla, React
// descarta la entrada optimista sola cuando la transición se resuelve sin
// una lista real actualizada — solo hace falta mostrar el mensaje de error.
export function TaskBoard({ tasks, projects }: { tasks: Task[]; projects: Project[] }) {
  const [optimisticTasks, addOptimisticTask] = useOptimistic(tasks, (state, newTask: Task) => [
    ...state,
    newTask,
  ]);
  const [error, setError] = useState<string | null>(null);
  // Guard contra doble-submit (doble clic): sin esto, dos formAction en
  // vuelo crean dos filas reales duplicadas (createTask no es idempotente).
  // useRef y no useState: setSubmitting(true) dentro de una transición (la
  // que React aplica automáticamente a las form actions) no se refleja de
  // forma síncrona en el closure de una segunda invocación disparada pocos
  // milisegundos después — verificado con un doble-submit real de 50ms que
  // SÍ duplicaba la fila con useState. El ref se actualiza síncronamente.
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  // Pasado directo como `action` del <form>: React 19 envuelve las form
  // actions en una transición automáticamente, así que addOptimisticTask
  // (que requiere estar dentro de una transición) puede llamarse aquí sin
  // useTransition/startTransition manual — es el patrón recomendado por
  // React para useOptimistic + Server Actions.
  async function formAction(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    const title = formData.get('title')?.toString().trim();
    const projectId = formData.get('projectId')?.toString() || '';
    const project = projects.find((p) => p.id === projectId) ?? null;

    if (title) {
      addOptimisticTask({
        id: `optimistic-${Date.now()}`,
        title,
        description: formData.get('description')?.toString().trim() || null,
        priority: formData.get('priority')?.toString() || 'LOW',
        status: formData.get('status')?.toString() || 'TODO',
        dueDate: null,
        project: project ? { name: project.name } : null,
        pending: true,
      });
    }

    try {
      await createTask(formData);
    } catch (e: any) {
      if (e?.digest?.startsWith('NEXT_REDIRECT')) return;
      setError('Error creando tarea. Intenta de nuevo.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <TaskPriorityShortcut />
        {error && (
          <p className="bg-danger-500/10 border border-danger-500 text-danger-500 rounded px-3 py-2 mb-4 text-sm">
            {error}
          </p>
        )}
        <div className="space-y-4">
          {optimisticTasks.length === 0 ? (
            <p className="text-gray-500">No hay tareas todavía. ¡Crea una abajo!</p>
          ) : (
            optimisticTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg h-fit">
        <h2 className="text-lg font-semibold mb-4">Nueva Tarea</h2>
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Título *</label>
            <input
              type="text"
              name="title"
              required
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Descripción</label>
            <textarea
              name="description"
              className="w-full h-20 bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Proyecto</label>
            <select
              name="projectId"
              defaultValue=""
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Inbox (sin clasificar todavía)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Prioridad</label>
            <select
              name="priority"
              defaultValue="LOW"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Estado</label>
            <select
              name="status"
              defaultValue="TODO"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING">Waiting</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Fecha límite</label>
            <input
              type="date"
              name="dueDate"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors w-full disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creando…' : 'Crear Tarea'}
          </button>
        </form>
      </div>
    </div>
  );
}
