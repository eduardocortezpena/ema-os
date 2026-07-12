import { getValidAccessToken } from '@/app/lib/google-drive-auth';

const EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

// Eventos de "todo el día" (Sprint 4.2, decisión de producto P2): usamos el
// campo `date` de la Calendar API, no `dateTime` — Tarea.dueDate es un
// DateTime en Prisma pero solo importa la parte de fecha aquí.
function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Sprint 4.3: minutos antes del evento para reminders.overrides. [] = sin
// recordatorios (reminders.useDefault: false, overrides vacío) en vez de
// heredar el default de la cuenta de Google.
function buildEventBody(title: string, date: Date, reminderMinutes: number[]): Record<string, unknown> {
  const dateStr = toDateOnly(date);
  return {
    summary: title,
    start: { date: dateStr },
    end: { date: dateStr },
    reminders: {
      useDefault: false,
      overrides: reminderMinutes.map((minutes) => ({ method: 'popup', minutes })),
    },
  };
}

/**
 * Crea un evento de todo el día en el calendario primario. Devuelve el
 * eventId. Lanza si Calendar no está conectado o falla la creación — el
 * caller decide degradar (guardar la tarea igual, eventId null).
 */
export async function createCalendarEvent(
  title: string,
  date: Date,
  reminderMinutes: number[] = []
): Promise<string> {
  const accessToken = await getValidAccessToken();
  const res = await fetch(EVENTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildEventBody(title, date, reminderMinutes)),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[google-calendar] Error creando evento (${res.status}):`, errBody);
    throw new Error('Error creando el evento en Google Calendar.');
  }

  const data = await res.json();
  return data.id as string;
}

/**
 * Actualiza un evento ya existente (PATCH sobre el eventId), en vez de crear
 * uno nuevo — evita duplicados cuando se edita la fecha, el título o los
 * recordatorios.
 */
export async function updateCalendarEvent(
  eventId: string,
  title: string,
  date: Date,
  reminderMinutes: number[] = []
): Promise<void> {
  const accessToken = await getValidAccessToken();
  const res = await fetch(`${EVENTS_URL}/${eventId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildEventBody(title, date, reminderMinutes)),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[google-calendar] Error actualizando evento (${res.status}):`, errBody);
    throw new Error('Error actualizando el evento en Google Calendar.');
  }
}

/**
 * Borra un evento del calendario primario. 404/410 (ya borrado) se trata
 * como éxito — idempotente, evita fallar si el evento ya no existe del lado
 * de Google (ej. borrado manual por el usuario).
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const accessToken = await getValidAccessToken();
  const res = await fetch(`${EVENTS_URL}/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const errBody = await res.text();
    console.error(`[google-calendar] Error borrando evento (${res.status}):`, errBody);
    throw new Error('Error borrando el evento en Google Calendar.');
  }
}
