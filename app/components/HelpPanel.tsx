'use client';

import { useEffect, useRef } from 'react';

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: 'Ctrl/Cmd + K', description: 'Abrir la paleta de comandos' },
  { keys: 'C', description: 'Nueva tarea (elige proyecto y título)' },
  { keys: 'N', description: 'Nueva nota (elige proyecto y título)' },
  { keys: 'P', description: 'Con el mouse sobre una tarea: avanza su prioridad' },
  { keys: 'G luego D', description: 'Ir a Dashboard' },
  { keys: 'G luego P', description: 'Ir a Proyectos' },
  { keys: 'G luego M', description: 'Ir a My Day' },
  { keys: '?', description: 'Abrir/cerrar este panel de ayuda' },
];

export function HelpPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Cierra con Escape y mueve el foco al panel al abrir, para quedar
  // consistente con el modal de CommandPalette (Radix Dialog lo hace nativo).
  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Atajos de teclado"
    >
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Atajos de teclado</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-sm"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <ul className="space-y-2">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{s.description}</span>
              <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-gray-400 whitespace-nowrap ml-3">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
        <p className="text-gray-500 text-xs mt-4">
          Los atajos no se activan mientras escribes en un campo de texto.
        </p>
      </div>
    </div>
  );
}
