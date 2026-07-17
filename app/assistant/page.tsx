'use client';

import { useRef, useState, type FormEvent } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

// Sprint 6.1: UI mínima de chat, Client Component con fetch + getReader
// manual (mismo patrón que TaskCard.tsx/CompleteTaskButton.tsx: useRef
// guard + useState optimista, sin librería de chat -- architect confirmó
// que el paquete `ai` de Vercel no se justifica para una sola pantalla sin
// historial persistido).
export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

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
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const text = acc;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: text };
          return copy;
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

  return (
    <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Asistente</h1>

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
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
    </div>
  );
}
