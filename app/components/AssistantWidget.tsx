'use client';

import { useState } from 'react';
import { AssistantChat } from './AssistantChat';

// Sprint 6.5 (Señor Dev): botón flotante global -- disponible en toda la
// app vía app/layout.tsx, no solo en /assistant. Abre un panel lateral con
// el mismo AssistantChat (sin duplicar lógica de OpenRouter/streaming).
export function AssistantWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        className="fixed bottom-6 right-6 z-50 bg-primary-500 hover:bg-primary-600 transition-colors text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-2xl"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] max-h-[70vh] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-bold">Asistente</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente"
              className="text-gray-500 hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <div className="p-4 overflow-y-auto">
            <AssistantChat />
          </div>
        </div>
      )}
    </>
  );
}
