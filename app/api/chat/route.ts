import { NextRequest } from 'next/server';
import { buildSystemPrompt } from '@/app/lib/assistant-context';
import { TOOL_DEFINITIONS, executeTool } from '@/app/lib/assistant-tools';

// Sprint 6.1: Route Handler de streaming, primer endpoint de este tipo en
// el proyecto (patrón ya establecido: Server Actions para mutaciones, Route
// Handler para lo que no lo es -- ver ARCHITECTURE.md, confirmado por
// architect). Fetch directo a OpenRouter (compatible con formato OpenAI),
// sin SDK.
export const runtime = 'nodejs';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Sprint 6.3: `openrouter/free` (auto-router no determinístico) resultó
// NO confiable para tool-calling -- verificado contra la API real que
// varios modelos del pool lo ignoran o fallan. Se fija un modelo gratuito
// específico que SÍ soporta tools de forma confiable (confirmado con una
// llamada real: devuelve `tool_calls` estructurado correctamente).
const DEFAULT_MODEL = 'nvidia/nemotron-nano-9b-v2:free';
// Fallback de pago barato si el modelo gratuito devuelve 429 -- usa el
// mismo crédito ya existente en la cuenta. Valor operativo, no
// arquitectónico: cambiar libremente si el precio/disponibilidad varía.
const FALLBACK_MODEL = 'openai/gpt-4o-mini';
// Límite de rondas de tool_use (architect): evita loops largos si el
// modelo pide tools repetidamente sin converger. Al llegar al límite se
// responde con el mejor texto disponible en vez de romper el chat.
const MAX_TOOL_ROUNDS = 3;

type ChatMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
};

async function callOpenRouterOnce(
  messages: ChatMessage[],
  model: string,
  opts: { stream: boolean; withTools?: boolean }
) {
  return fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: opts.stream,
      ...(opts.withTools ? { tools: TOOL_DEFINITIONS } : {}),
    }),
  });
}

// Llama con el modelo por defecto; si devuelve 429, reintenta una vez con
// el fallback de pago. Reusado tanto para las rondas de decisión de tools
// (no-streaming) como para la respuesta final (streaming).
async function callWithFallback(messages: ChatMessage[], opts: { stream: boolean; withTools?: boolean }) {
  let res = await callOpenRouterOnce(messages, DEFAULT_MODEL, opts);
  if (res.status === 429) {
    console.error(`[chat] ${DEFAULT_MODEL} devolvió 429 (rate limit), fallback a ${FALLBACK_MODEL}`);
    res = await callOpenRouterOnce(messages, FALLBACK_MODEL, opts);
  }
  return res;
}

function streamPlainTextFromSSE(upstream: Response): ReadableStream {
  const reader = upstream.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
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
}

function textResponse(text: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
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
  // confía en uno que mande el cliente.
  const systemPrompt = await buildSystemPrompt();
  const conversation: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.filter((m) => m.role !== 'system'),
  ];

  // Sprint 6.3: loop de tool_use. Arquitectura (architect): rondas de
  // DECISIÓN sin streaming (simple inspeccionar tool_calls; un solo
  // usuario no nota la latencia extra), streaming SOLO para la respuesta
  // final de texto.
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const decision = await callWithFallback(conversation, { stream: false, withTools: true });

    if (!decision.ok) {
      const errBody = await decision.text().catch(() => '');
      console.error(`[chat] Error de OpenRouter (${decision.status}):`, errBody);
      return new Response('Error contactando al asistente. Intenta de nuevo.', { status: 502 });
    }

    const data = await decision.json();
    const message = data.choices?.[0]?.message;

    if (!message?.tool_calls || message.tool_calls.length === 0) {
      // Sin tools en esta ronda: la respuesta ya está completa, no hace
      // falta re-llamar con stream:true solo para simular streaming.
      return textResponse(message?.content ?? '');
    }

    conversation.push({ role: 'assistant', content: message.content ?? null, tool_calls: message.tool_calls });

    for (const call of message.tool_calls) {
      let args: unknown = {};
      try {
        args = JSON.parse(call.function.arguments || '{}');
      } catch {
        console.error(`[chat] tool_call.arguments mal formado para ${call.function.name}:`, call.function.arguments);
        args = {};
      }
      const result = await executeTool(call.function.name, args);
      conversation.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Se llegó al límite de rondas sin converger: responder con el mejor
  // texto disponible en vez de romper el chat (architect: degradar, no
  // fallar duro).
  const finalCall = await callWithFallback(conversation, { stream: true });
  if (!finalCall.ok || !finalCall.body) {
    const errBody = await finalCall.text().catch(() => '');
    console.error(`[chat] Error de OpenRouter en respuesta final (${finalCall.status}):`, errBody);
    return new Response('Error contactando al asistente. Intenta de nuevo.', { status: 502 });
  }

  return new Response(streamPlainTextFromSSE(finalCall), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
