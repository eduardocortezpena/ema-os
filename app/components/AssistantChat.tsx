'use client';

import { useRef, useState, type FormEvent } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };
type PendingConfirmation = { confirmationId: string; tool: string; args: Record<string, unknown> };

// Nombres legibles para las tools de escritura (Sprint 6.4) — el usuario
// nunca debería ver el nombre técnico de la función.
const TOOL_LABELS: Record<string, string> = {
  crear_tarea: 'Crear tarea',
  crear_nota: 'Crear nota',
  completar_tarea: 'Completar tarea',
  mover_archivo_a_proyecto: 'Mover archivo a otro proyecto',
};

// Sprint 6.1: UI mínima de chat, Client Component con fetch + getReader
// manual (mismo patrón que TaskCard.tsx/CompleteTaskButton.tsx: useRef
// guard + useState optimista, sin librería de chat -- architect confirmó
// que el paquete `ai` de Vercel no se justifica para una sola pantalla sin
// historial persistido).
// Sprint 6.5 (Señor Dev): extraído de app/assistant/page.tsx para reusarse
// como panel flotante global. Misma lógica, sin duplicación.
export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  // Sprint 6.4: propuesta de acción pendiente de confirmación REAL del
  // usuario (clic físico en un botón, nunca texto libre interpretado por
  // el modelo -- regla dura no negociable de la sesión).
  const [pending, setPending] = useState<PendingConfirmation | null>(null);

  async function readStreamedText(res: Response, onChunk: (acc: string) => void) {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let acc = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      onChunk(acc);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (sendingRef.current || !input.trim()) return;
    sendingRef.current = true;
    setSending(true);

    const userMessage: Message = { role: 'user', content: input.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => 'Error del asistente.');
        throw new Error(errText);
      }

      const contentType = res.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        // Sprint 6.4: el modelo pidió una tool de escritura. NO se ejecutó
        // nada todavía -- se muestra la propuesta con botones reales.
        const data = (await res.json()) as PendingConfirmation & { type: string };
        setPending({ confirmationId: data.confirmationId, tool: data.tool, args: data.args });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: '(esperando tu confirmación abajo)' };
          return copy;
        });
      } else {
        await readStreamedText(res, (acc) => {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: 'assistant', content: acc };
            return copy;
          });
        });
      }
    } catch (error) {
      console.error('[assistant] Error:', error);
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: 'assistant',
          content: 'Error contactando al asistente. Intenta de nuevo.',
        };
        return copy;
      });
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  async function handleConfirm(confirm: boolean) {
    if (!pending || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    const confirmationId = pending.confirmationId;
    setPending(null);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationId, confirm }),
      });
      if (!res.ok || !res.body) throw new Error('Error confirmando la acción.');
      await readStreamedText(res, (acc) => {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      });
    } catch (error) {
      console.error('[assistant] Error confirmando:', error);
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: 'Error ejecutando la acción. Intenta de nuevo.' };
        return copy;
      });
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <div>
      <p className="text-gray-500 text-xs mb-4">
        Tus datos de proyecto (nombres, prioridad, tareas abiertas) se envían al proveedor de IA vía OpenRouter para responder. Ninguna acción de escritura se ejecuta sin tu confirmación.
      </p>

      <div className="space-y-3 mb-4 min-h-[300px]">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm">Pregúntale algo al asistente.</p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-primary-500/20 ml-8' : 'bg-gray-800 mr-8'}`}
            >
              <span className="text-xs text-gray-500 block mb-1">
                {m.role === 'user' ? 'Tú' : 'Asistente'}
              </span>
              <p className="whitespace-pre-wrap">{m.content || '…'}</p>
            </div>
          ))
        )}

        {pending && (
          <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500 mr-8">
            <p className="font-semibold mb-1">{TOOL_LABELS[pending.tool] ?? pending.tool}</p>
            <ul className="text-sm text-gray-300 mb-3 space-y-0.5">
              {Object.entries(pending.args).map(([k, v]) => (
                <li key={k}>
                  <span className="text-gray-500">{k}:</span> {String(v)}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleConfirm(true)}
                disabled={sending}
                className="bg-primary-500 px-3 py-1.5 rounded hover:bg-primary-600 transition-colors text-sm disabled:opacity-50"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => handleConfirm(false)}
                disabled={sending}
                className="bg-gray-700 px-3 py-1.5 rounded hover:bg-gray-600 transition-colors text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending || !!pending}
          placeholder="Escribe tu mensaje..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !!pending}
          className="bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
