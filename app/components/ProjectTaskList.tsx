'use client';

import { useOptimistic, useRef, useState } from 'react';
import { createTask } from '@/app/actions';
import { TaskCard, type Task } from './TaskCard';

// Lista de tareas acotada a UN proyecto (Sprint 9.1, /projects/[id]) — mismo
// patrón de useOptimistic + guard useRef que TaskBoard.tsx (Sprint 7.3), pero
// sin selector de proyecto en el formulario de creación (el proyecto ya está
// fijo por la ruta, va como campo oculto).
export function ProjectTaskList({ projectId, tasks }: { projectId: string; tasks: Task[] }) {
  const returnTo = `/projects/${projectId}`;
  const [optimisticTasks, addOptimisticTask] = useOptimistic(tasks, (state, newTask: Task) => [
    ...state,
    newTask,
  ]);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  async function formAction(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    const title = formData.get('title')?.toString().trim();

    if (title) {
      addOptimisticTask({
        id: `optimistic-${Date.now()}`,
        title,
        description: formData.get('description')?.toString().trim() || null,
        priority: formData.get('priority')?.toString() || 'LOW',
        status: 'TODO',
        dueDate: null,
        project: null,
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
    <div>
      {error && (
        <p className="bg-danger-500/10 border border-danger-500 text-danger-500 rounded px-3 py-2 mb-4 text-sm">
          {error}
        </p>
      )}
      <div className="space-y-3 mb-4">
        {optimisticTasks.length === 0 ? (
          <p className="text-gray-500 text-sm">Sin tareas todavía. ¡Crea una abajo!</p>
        ) : (
          optimisticTasks.map((task) => (
            <TaskCard key={task.id} task={task} showProject={false} returnTo={returnTo} />
          ))
        )}
      </div>

      <form action={formAction} className="bg-gray-900 p-3 rounded-lg space-y-2">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <input
          type="text"
          name="title"
          required
          placeholder="Nueva tarea..."
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex gap-2">
          <select
            name="priority"
            defaultValue="LOW"
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creando…' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
}
