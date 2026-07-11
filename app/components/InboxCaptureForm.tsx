'use client';

import { useRef } from 'react';
import { createTask } from '@/app/actions';

// Guard contra doble-submit — mismo bug de clase que TaskBoard/NoteBoard
// (Sprint 7.3): createTask no es idempotente, un doble clic crea dos
// ítems de inbox duplicados. useRef (síncrono), no useState.
export function InboxCaptureForm() {
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function formAction(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await createTask(formData);
      formRef.current?.reset();
    } catch (e: any) {
      // redirect() de error (ej. título vacío) navega de fondo a
      // /inbox?error=... — el banner de esa ruta ya lo muestra.
      if (!e?.digest?.startsWith('NEXT_REDIRECT')) {
        console.error('[InboxCaptureForm] Error capturando:', e);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <form ref={formRef} action={formAction} className="flex gap-2 mb-6">
      <input
        type="text"
        name="title"
        required
        autoFocus
        placeholder="Capturar una idea o tarea..."
        className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <button
        type="submit"
        className="bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors whitespace-nowrap"
      >
        Capturar
      </button>
    </form>
  );
}
