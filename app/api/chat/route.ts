import { NextRequest } from 'next/server';
import { buildSystemPrompt } from '@/app/lib/assistant-context';

// Sprint 6.1: Route Handler de streaming, primer endpoint de este tipo en
// el proyecto (patrón ya establecido: Server Actions para mutaciones, Route
// Handler para lo que no lo es -- ver ARCHITECTURE.md, confirmado por
// architect). Fetch directo a OpenRouter (compatible con formato OpenAI),
// sin SDK: OpenRouter no necesita nada más que esto.
export const runtime = 'nodejs';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openrouter/free';
// Fallback de pago barato si el pool gratuito devuelve 429 -- usa el mismo
// crédito ya existente en la cuenta. Valor operativo, no arquitectónico:
// cambiar libremente si el precio/disponibilidad varía (architect).
const FALLBACK_MODEL = 'openai/gpt-4o-mini';

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

async function callOpenRouter(messages: ChatMessage[], model: string) {
  return fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });
}

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: ChatMessage[] };

  if (!process.env.OPENROUTER_API_KEY) {
    return new Response('OPENROUTER_API_KEY no configurada en el servidor.', { status: 500 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('Se requiere al menos un mensaje.', { status: 400 });
  }

  // Sprint 6.2: el system prompt SIEMPRE se arma server-side, nunca se
  // confía en uno que mande el cliente -- se descarta cualquier mensaje
  // 'system' que venga en el body antes de anteponer el nuestro.
  const systemPrompt = await buildSystemPrompt();
  const messagesWithContext: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.filter((m) => m.role !== 'system'),
  ];

  let upstream = await callOpenRouter(messagesWithContext, DEFAULT_MODEL);

  if (upstream.status === 429) {
    console.error(`[chat] ${DEFAULT_MODEL} devolvió 429 (rate limit), fallback a ${FALLBACK_MODEL}`);
    upstream = await callOpenRouter(messagesWithContext, FALLBACK_MODEL);
  }

  if (!upstream.ok || !upstream.body) {
    const errBody = await upstream.text().catch(() => '');
    console.error(`[chat] Error de OpenRouter (${upstream.status}):`, errBody);
    return new Response('Error contactando al asistente. Intenta de nuevo.', { status: 502 });
  }

  // Reenvía el stream SSE de OpenRouter como texto plano: extrae solo
  // choices[0].delta.content de cada evento, sin exponer el formato SSE
  // crudo al cliente -- simplifica el consumidor (fetch + getReader, sin
  // parseo de SSE en el navegador).
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // Línea SSE incompleta o de control (comentario keep-alive) — ignorar.
            }
          }
        }
      } catch (error) {
        console.error('[chat] Error leyendo el stream de OpenRouter:', error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
