import prisma from '../../lib/prisma';
import { createTask, markTaskComplete, deleteTask } from '../actions';

export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([
    prisma.tarea.findMany({
      include: {
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.proyecto.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Tasks</h1>
        </div>

        {projects.length === 0 && (
          <p className="text-amber-400 mb-4">
            ⚠️ You need to create a Project first before creating tasks.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <p className="text-gray-500">No tasks yet. Create one below!</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{task.title}</h3>
                          {task.status === 'DONE' && (
                            <span className="text-green-400 text-sm">✓ Done</span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-gray-400 text-sm mt-1">{task.description}</p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                          <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status}</span>
                          {task.dueDate && (
                            <span className="badge bg-gray-700">
                              {task.dueDate.toLocaleDateString()}
                            </span>
                          )}
                          <span className="badge bg-gray-700">
                            {task.project?.name ?? 'No project'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {task.status !== 'DONE' && (
                          <form action={markTaskComplete}>
                            <input type="hidden" name="id" value={task.id} />
                            <input type="hidden" name="projectId" value={task.projectId} />
                            <button type="submit" className="text-green-400 hover:text-white text-sm">
                              ✓ Complete
                            </button>
                          </form>
                        )}
                        <form action={deleteTask} onSubmit={(e) => {
                          if (!confirm('Delete this task?')) e.preventDefault();
                        }}>
                          <input type="hidden" name="id" value={task.id} />
                          <input type="hidden" name="projectId" value={task.projectId} />
                          <button type="submit" className="text-danger-500 hover:text-white text-sm">
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg h-fit">
            <h2 className="text-lg font-semibold mb-4">New Task</h2>
            <form action={createTask} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea
                  name="description"
                  className="w-full h-20 bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Project *</label>
                <select
                  name="projectId"
                  required
                  defaultValue=""
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="" disabled>Select a project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Priority</label>
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
                <label className="block text-sm mb-1">Status</label>
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
                <label className="block text-sm mb-1">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                type="submit"
                disabled={projects.length === 0}
                className="bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors w-full disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}