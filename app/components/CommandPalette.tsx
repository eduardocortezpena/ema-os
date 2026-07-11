'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { quickCreateProject, quickCreateTask, quickCreateNote } from '@/app/actions/quick-create';

type Project = { id: string; name: string };

type Mode =
  | { kind: 'root' }
  | { kind: 'project-name' }
  | { kind: 'select-project'; for: 'task' | 'note' }
  | { kind: 'entity-title'; for: 'task' | 'note'; projectId: string; projectName: string };

const NAV_ITEMS = [
  { label: 'Ir a Dashboard', href: '/dashboard' },
  { label: 'Ir a My Day', href: '/my-day' },
  { label: 'Ir a Proyectos', href: '/projects' },
  { label: 'Ir a Tareas', href: '/tasks' },
  { label: 'Ir a Notas', href: '/notes' },
  { label: 'Ir a Archivos', href: '/files' },
  { label: 'Ir a Configuración', href: '/settings' },
];

export function CommandPalette({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: 'root' });
  const [inputValue, setInputValue] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const reset = useCallback(() => {
    setMode({ kind: 'root' });
    setInputValue('');
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  function goTo(href: string) {
    close();
    router.push(href);
  }

  async function submitProjectName() {
    const name = inputValue.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      await quickCreateProject(name);
      router.refresh();
      close();
    } catch (error) {
      // Cuando la Server Action llama a redirect() en su rama de error (ej.
      // nombre vacío), la navegación de fondo SÍ ocurre pero la promesa que
      // esperamos aquí se rechaza (comportamiento de Next con Server Actions
      // invocadas directamente, no vía <form>). Sin este catch la paleta
      // quedaba atascada tapando la página que ya navegó con el error.
      console.error('[CommandPalette] Error creando proyecto:', error);
      close();
    } finally {
      setBusy(false);
    }
  }

  async function submitEntityTitle(projectId: string, kind: 'task' | 'note') {
    const title = inputValue.trim();
    if (!title || busy) return;
    setBusy(true);
    try {
      if (kind === 'task') await quickCreateTask(projectId, title);
      else await quickCreateNote(projectId, title);
      router.refresh();
      close();
    } catch (error) {
      // Mismo caso que submitProjectName: redirect() de error rechaza la
      // promesa. Cerrar en vez de dejar el modal atascado.
      console.error('[CommandPalette] Error creando entidad:', error);
      close();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      shouldFilter={mode.kind === 'root'}
    >
      <div className="fixed inset-0 bg-black/60" onClick={close} />
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
        {mode.kind === 'root' && (
          <Command.Input
            autoFocus
            placeholder="Navegar o crear... (proyecto, tarea, nota)"
            className="w-full bg-gray-900 px-4 py-3 text-sm text-gray-100 border-b border-gray-700 focus:outline-none"
          />
        )}

        {mode.kind !== 'root' && (
          <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="text-gray-500 hover:text-gray-300 text-sm"
              aria-label="Volver"
            >
              ←
            </button>
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (mode.kind === 'project-name') submitProjectName();
                  if (mode.kind === 'entity-title') submitEntityTitle(mode.projectId, mode.for);
                }
              }}
              disabled={busy}
              placeholder={
                mode.kind === 'project-name'
                  ? 'Nombre del proyecto...'
                  : mode.kind === 'entity-title'
                    ? `Título de la ${mode.for === 'task' ? 'tarea' : 'nota'} en ${mode.projectName}...`
                    : 'Selecciona un proyecto...'
              }
              className="flex-1 bg-transparent text-sm text-gray-100 focus:outline-none"
            />
          </div>
        )}

        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-gray-500">
            Sin resultados.
          </Command.Empty>

          {mode.kind === 'root' && (
            <>
              <Command.Group heading="Navegación" className="text-xs text-gray-500 px-2 py-1">
                {NAV_ITEMS.map((item) => (
                  <Command.Item
                    key={item.href}
                    onSelect={() => goTo(item.href)}
                    className="px-3 py-2 rounded text-sm text-gray-200 cursor-pointer data-[selected=true]:bg-gray-800"
                  >
                    {item.label}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Crear" className="text-xs text-gray-500 px-2 py-1 mt-2">
                <Command.Item
                  onSelect={() => setMode({ kind: 'project-name' })}
                  className="px-3 py-2 rounded text-sm text-gray-200 cursor-pointer data-[selected=true]:bg-gray-800"
                >
                  Nuevo proyecto...
                </Command.Item>
                <Command.Item
                  onSelect={() => setMode({ kind: 'select-project', for: 'task' })}
                  className="px-3 py-2 rounded text-sm text-gray-200 cursor-pointer data-[selected=true]:bg-gray-800"
                >
                  Nueva tarea...
                </Command.Item>
                <Command.Item
                  onSelect={() => setMode({ kind: 'select-project', for: 'note' })}
                  className="px-3 py-2 rounded text-sm text-gray-200 cursor-pointer data-[selected=true]:bg-gray-800"
                >
                  Nueva nota...
                </Command.Item>
              </Command.Group>
            </>
          )}

          {mode.kind === 'select-project' && (
            <Command.Group>
              {projects.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-500">
                  No hay proyectos todavía. Crea uno primero.
                </p>
              )}
              {projects.map((p) => (
                <Command.Item
                  key={p.id}
                  onSelect={() =>
                    setMode({ kind: 'entity-title', for: mode.for, projectId: p.id, projectName: p.name })
                  }
                  className="px-3 py-2 rounded text-sm text-gray-200 cursor-pointer data-[selected=true]:bg-gray-800"
                >
                  {p.name}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {(mode.kind === 'project-name' || mode.kind === 'entity-title') && (
            <p className="px-3 py-2 text-xs text-gray-500">
              {busy ? 'Creando…' : 'Presiona Enter para crear.'}
            </p>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
