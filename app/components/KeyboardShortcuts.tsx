'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HelpPanel } from './HelpPanel';
import { isTypingTarget } from '@/app/lib/keyboard';

const CHORD_TIMEOUT_MS = 800;

// Atajos globales de teclado (Sprint 7.2). C/N abren la command palette
// directo en el flujo de creación correspondiente (evento custom, sin
// duplicar la lógica de creación que ya vive en CommandPalette). G+D/P/M son
// atajos de "chord" (dos teclas en secuencia, estilo Gmail/Linear). ? abre el
// panel de ayuda. Ningún atajo se activa si el foco está en un campo de
// texto — evita interferir con escritura normal y con la propia paleta.
export function KeyboardShortcuts() {
  const [helpOpen, setHelpOpen] = useState(false);
  const router = useRouter();
  const pendingChord = useRef(false);
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();

      // Con el panel de ayuda abierto, solo "?" (para cerrarlo) hace algo —
      // evita que C/N/chord G queden apiladas encima sin poder cerrarlas.
      if (helpOpen && key !== '?') return;

      if (pendingChord.current) {
        pendingChord.current = false;
        if (chordTimer.current) clearTimeout(chordTimer.current);
        if (key === 'd') router.push('/dashboard');
        else if (key === 'p') router.push('/projects');
        else if (key === 'm') router.push('/my-day');
        return;
      }

      if (key === 'g') {
        pendingChord.current = true;
        chordTimer.current = setTimeout(() => {
          pendingChord.current = false;
        }, CHORD_TIMEOUT_MS);
        return;
      }

      if (key === 'c') {
        window.dispatchEvent(new CustomEvent('ema-open-create', { detail: { for: 'task' } }));
        return;
      }

      if (key === 'n') {
        window.dispatchEvent(new CustomEvent('ema-open-create', { detail: { for: 'note' } }));
        return;
      }

      if (key === '?') {
        setHelpOpen((prev) => !prev);
        return;
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (chordTimer.current) clearTimeout(chordTimer.current);
    };
  }, [router, helpOpen]);

  return <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />;
}
