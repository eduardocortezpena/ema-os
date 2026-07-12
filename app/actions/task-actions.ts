'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/app/lib/db';
import { toUserMessage } from '@/app/lib/errors';
import { startOfDay } from '@/app/lib/date';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/app/lib/google-calendar';

// Ruta a la que redirigir en error y a revalidar además de las fijas
// (Sprint 9.1): createTask/updateTaskStatus/updateTaskPriority/deleteTask
// ahora se invocan tanto desde /tasks (TaskBoard) como desde
// /projects/[id] (ProjectTaskList, vía TaskCard). Sin `returnTo` explícito
// en el form, cae a /tasks (comportamiento previo, retrocompatible).
function taskReturnTo(formData: FormData): string {
  const value = formData.get('returnTo')?.toString() || '';
  return value.startsWith('/') && !value.startsWith('//') ? value : '/tasks';
}

type ReminderPreset = 'DEFAULT' | 'THREE_DAYS' | 'FIVE_DAYS' | 'ONE_DAY' | 'NONE';

// Minutos antes del evento por preset (Sprint 4.3). DEFAULT = 3 y 5 días
// (4320 y 7200 min) sin que el usuario tenga que elegir nada.
const REMINDER_MINUTES: Record<ReminderPreset, number[]> = {
  DEFAULT: [4320, 7200],
  THREE_DAYS: [4320],
  FIVE_DAYS: [7200],
  ONE_DAY: [1440],
  NONE: [],
};

// Sincroniza el evento de Calendar de una tarea con su estado actual
// (Sprint 4.2/4.3). Decisión de producto: P1 — solo tareas CON proyecto
// sincronizan; P2 — eventos de todo el día. Nunca lanza: mismo patrón
// graceful de mirrorToDrive (app/actions/notes.ts) — si Calendar falla, la
// tarea se guarda igual y el eventId conserva el valor previo.
async function syncCalendarEvent(
  title: string,
  projectId: string | null,
  dueDate: Date | null,
  existingEventId: string | null,
  reminderPreset: ReminderPreset
): Promise<string | null> {
  try {
    if (!projectId || !dueDate) {
      if (existingEventId) await deleteCalendarEvent(existingEventId);
      return null;
    }
    const reminderMinutes = REMINDER_MINUTES[reminderPreset];
    if (existingEventId) {
      await updateCalendarEvent(existingEventId, title, dueDate, reminderMinutes);
      return existingEventId;
    }
    return await createCalendarEvent(title, dueDate, reminderMinutes);
  } catch (error) {
    console.error('[task-actions] No se pudo sincronizar el evento de Calendar (tarea guardada igual):', error);
    return existingEventId;
  }
}

export async function createTask(formData: FormData) {
  const returnTo = taskReturnTo(formData);
  try {
    const title = formData.get('title')?.toString().trim();
    const description = formData.get('description')?.toString().trim() || null;
    const priority = (formData.get('priority')?.toString() || 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    const status = (formData.get('status')?.toString() || 'TODO') as 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE';
    const dueDateStr = formData.get('dueDate')?.toString().trim() || null;
    const projectId = formData.get('projectId')?.toString() || '';

    if (!title || title.length === 0) {
      redirect(`${returnTo}?error=${encodeURIComponent('Título de tarea requerido')}`);
    }

    // projectId vacío = ítem de inbox sin clasificar (Sprint 7.4, Quick
    // Capture) — ya no es obligatorio. Si viene, sí debe existir de verdad
    // (mismo guard que createNote, contra proyecto borrado/inválido).
    if (projectId) {
      const project = await prisma.proyecto.findUnique({ where: { id: projectId } });
      if (!project) {
        redirect(`${returnTo}?error=${encodeURIComponent('Proyecto no encontrado')}`);
      }
    }

    const dueDate = dueDateStr ? new Date(dueDateStr) : null;

    // Crear la fila primero (eventId null) y sincronizar Calendar después,
    // mismo orden que mirrorToDrive en app/actions/notes.ts: si la llamada a
    // Calendar falla o el proceso muere entre medias, no queda un evento
    // huérfano en Calendar sin ninguna fila en la DB que lo referencie.
    const created = await prisma.tarea.create({
      data: {
        title: title,
        description: description,
        priority: priority,
        status: status,
        dueDate: dueDate,
        projectId: projectId || null,
      },
    });

    const eventId = await syncCalendarEvent(title, projectId || null, dueDate, null, 'DEFAULT');
    if (eventId) {
      await prisma.tarea.update({ where: { id: created.id }, data: { eventId } });
    }

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    revalidatePath('/inbox');
    revalidatePath(returnTo);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`${returnTo}?error=${encodeURIComponent(toUserMessage(error, 'Error creando tarea. Intenta de nuevo.'))}`);
  }
}

/**
 * Clasifica un ítem de inbox: le asigna un proyecto (Sprint 7.4). Simple
 * update de projectId — el ítem deja de ser inbox en cuanto projectId deja
 * de ser null. Valida que el proyecto destino exista (mismo guard que
 * createTask).
 */
export async function assignTaskToProject(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';
    const projectId = formData.get('projectId')?.toString() || '';

    if (!id) {
      redirect(`/inbox?error=${encodeURIComponent('ID de tarea requerido')}`);
    }
    if (!projectId) {
      redirect(`/inbox?error=${encodeURIComponent('Selecciona un proyecto')}`);
    }

    const project = await prisma.proyecto.findUnique({ where: { id: projectId } });
    if (!project) {
      redirect(`/inbox?error=${encodeURIComponent('Proyecto no encontrado')}`);
    }

    await prisma.tarea.update({
      where: { id },
      data: { projectId },
    });

    revalidatePath('/inbox');
    revalidatePath('/tasks');
    revalidatePath('/dashboard');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/inbox?error=${encodeURIComponent(toUserMessage(error, 'Error clasificando la tarea. Intenta de nuevo.'))}`);
  }
}

export async function updateTaskStatus(formData: FormData) {
  const returnTo = taskReturnTo(formData);
  try {
    const id = formData.get('id')?.toString() || '';
    const status = formData.get('status')?.toString() as 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE';

    if (!id) {
      redirect(`${returnTo}?error=${encodeURIComponent('ID de tarea requerido')}`);
    }
    if (!['TODO', 'IN_PROGRESS', 'WAITING', 'DONE'].includes(status)) {
      redirect(`${returnTo}?error=${encodeURIComponent('Status inválido')}`);
    }

    const data: { status: typeof status; eventId?: null } = { status };

    // Al completar una tarea con evento sincronizado, borrarlo (Sprint 4.2:
    // "completar/borrar la tarea, borrar el evento según corresponda"). Si
    // el borrado falla, se deja el eventId intacto en vez de asumir éxito.
    if (status === 'DONE') {
      const existing = await prisma.tarea.findUnique({ where: { id } });
      if (existing?.eventId) {
        try {
          await deleteCalendarEvent(existing.eventId);
          data.eventId = null;
        } catch (error) {
          console.error('[task-actions] No se pudo borrar el evento de Calendar al completar (tarea se completa igual):', error);
        }
      }
    }

    await prisma.tarea.update({
      where: { id },
      data,
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    revalidatePath(returnTo);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`${returnTo}?error=${encodeURIComponent(toUserMessage(error, 'Error actualizando la tarea. Intenta de nuevo.'))}`);
  }
}

/**
 * Cambia la fecha límite de una tarea después de creada (Sprint 4.2 — hoy
 * no existía forma de editar dueDate post-creación). Sincroniza el evento
 * de Calendar con el nuevo estado (crea/actualiza/borra según corresponda).
 */
export async function updateTaskDueDate(formData: FormData) {
  const returnTo = taskReturnTo(formData);
  try {
    const id = formData.get('id')?.toString() || '';
    const dueDateStr = formData.get('dueDate')?.toString().trim() || '';

    if (!id) {
      redirect(`${returnTo}?error=${encodeURIComponent('ID de tarea requerido')}`);
    }

    const existing = await prisma.tarea.findUnique({ where: { id } });
    if (!existing) {
      redirect(`${returnTo}?error=${encodeURIComponent('Tarea no encontrada')}`);
    }

    const dueDate = dueDateStr ? new Date(dueDateStr) : null;
    const eventId = await syncCalendarEvent(
      existing!.title,
      existing!.projectId,
      dueDate,
      existing!.eventId,
      existing!.reminderPreset as ReminderPreset
    );

    await prisma.tarea.update({
      where: { id },
      data: { dueDate, eventId },
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    revalidatePath(returnTo);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`${returnTo}?error=${encodeURIComponent(toUserMessage(error, 'Error actualizando la fecha. Intenta de nuevo.'))}`);
  }
}

/**
 * Cambia el preset de recordatorios de una tarea (Sprint 4.3). Si ya tiene
 * evento sincronizado (proyecto + dueDate), re-sincroniza de inmediato con
 * los nuevos minutos; si no, solo guarda el preset para cuando se cree el
 * evento (mismo criterio ya validado por architect: no hay caso borde donde
 * re-sincronizar sea innecesario o riesgoso, `syncCalendarEvent` ya cubre
 * "sin evento todavía" devolviendo null sin llamar a la API).
 */
export async function updateTaskReminderPreset(formData: FormData) {
  const returnTo = taskReturnTo(formData);
  try {
    const id = formData.get('id')?.toString() || '';
    const reminderPreset = formData.get('reminderPreset')?.toString() as ReminderPreset;

    if (!id) {
      redirect(`${returnTo}?error=${encodeURIComponent('ID de tarea requerido')}`);
    }
    if (!Object.keys(REMINDER_MINUTES).includes(reminderPreset)) {
      redirect(`${returnTo}?error=${encodeURIComponent('Preset de recordatorio inválido')}`);
    }

    const existing = await prisma.tarea.findUnique({ where: { id } });
    if (!existing) {
      redirect(`${returnTo}?error=${encodeURIComponent('Tarea no encontrada')}`);
    }

    const eventId = await syncCalendarEvent(
      existing!.title,
      existing!.projectId,
      existing!.dueDate,
      existing!.eventId,
      reminderPreset
    );

    await prisma.tarea.update({
      where: { id },
      data: { reminderPreset, eventId },
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    revalidatePath(returnTo);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`${returnTo}?error=${encodeURIComponent(toUserMessage(error, 'Error actualizando el recordatorio. Intenta de nuevo.'))}`);
  }
}

export async function updateTaskPriority(formData: FormData) {
  const returnTo = taskReturnTo(formData);
  try {
    const id = formData.get('id')?.toString() || '';
    const priority = formData.get('priority')?.toString() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

    if (!id) {
      redirect(`${returnTo}?error=${encodeURIComponent('ID de tarea requerido')}`);
    }
    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priority)) {
      redirect(`${returnTo}?error=${encodeURIComponent('Prioridad inválida')}`);
    }

    await prisma.tarea.update({
      where: { id },
      data: { priority },
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    revalidatePath(returnTo);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`${returnTo}?error=${encodeURIComponent(toUserMessage(error, 'Error actualizando la prioridad. Intenta de nuevo.'))}`);
  }
}

export async function planForToday(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      redirect(`/my-day?error=${encodeURIComponent('ID de tarea requerido')}`);
    }

    await prisma.tarea.update({
      where: { id },
      data: { plannedFor: startOfDay(new Date()) },
    });

    revalidatePath('/my-day');
    revalidatePath('/tasks');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/my-day?error=${encodeURIComponent(toUserMessage(error, 'Error planificando la tarea. Intenta de nuevo.'))}`);
  }
}

export async function rolloverToTomorrow(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      redirect(`/my-day?error=${encodeURIComponent('ID de tarea requerido')}`);
    }

    const tomorrow = startOfDay(new Date());
    tomorrow.setDate(tomorrow.getDate() + 1);

    await prisma.tarea.update({
      where: { id },
      data: { plannedFor: tomorrow },
    });

    revalidatePath('/my-day');
    revalidatePath('/tasks');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/my-day?error=${encodeURIComponent(toUserMessage(error, 'Error moviendo la tarea a mañana. Intenta de nuevo.'))}`);
  }
}

export async function unplanTask(formData: FormData) {
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      redirect(`/my-day?error=${encodeURIComponent('ID de tarea requerido')}`);
    }

    await prisma.tarea.update({
      where: { id },
      data: { plannedFor: null },
    });

    revalidatePath('/my-day');
    revalidatePath('/tasks');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/my-day?error=${encodeURIComponent(toUserMessage(error, 'Error quitando la tarea de hoy. Intenta de nuevo.'))}`);
  }
}

export async function deleteTask(formData: FormData) {
  const returnTo = taskReturnTo(formData);
  try {
    const id = formData.get('id')?.toString() || '';

    if (!id) {
      redirect(`${returnTo}?error=${encodeURIComponent('ID de tarea requerido')}`);
    }

    const existing = await prisma.tarea.findUnique({ where: { id } });
    if (existing?.eventId) {
      try {
        await deleteCalendarEvent(existing.eventId);
      } catch (error) {
        console.error('[task-actions] No se pudo borrar el evento de Calendar (tarea se borra igual):', error);
      }
    }

    await prisma.tarea.delete({
      where: { id },
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    revalidatePath(returnTo);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`${returnTo}?error=${encodeURIComponent(toUserMessage(error, 'Error eliminando tarea. Intenta de nuevo.'))}`);
  }
}
