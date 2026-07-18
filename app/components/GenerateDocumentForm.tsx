'use client';

import { useRef, useState } from 'react';
import {
  generateDocumentFromTask,
  generateDocumentAndCompleteTask,
} from '@/app/actions/document-actions';

// Botón/formulario "Generar documento" por tarea (Fase 5/6 UI). Se renderiza
// en el detalle del proyecto (/projects/[id]) debajo de cada TaskCard.
//
// Por qué es un componente aparte y NO vive dentro de TaskCard.tsx:
// TaskCard ya maneja 3 mutex de mutación (prioridad/estado/completar) y 5
// controles inline. Añadirle el flujo de generación (selector de plantilla
// + JSON de datos + checkbox de completar) lo sobrecargaría y acoplaría a
// la lógica de documentos, que solo aplica en el contexto de un proyecto
// con plantillas disponibles.
//
// Usa las Server Actions existentes en document-actions.ts:
// - generateDocumentFromTask: genera y adjunta el archivo al proyecto.
// - generateDocumentAndCompleteTask: igual + marca la tarea como DONE.
//
// Patrón anti-doble-submit con useRef (mismo que ProjectTaskList.tsx).
export type TemplateOption = {
  id: string;
  name: string;
  docType: string;
};

export function GenerateDocumentForm({
  taskId,
  templates,
  returnTo,
}: {
  taskId: string;
  templates: TemplateOption[];
  returnTo: string;
}) {
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (templates.length === 0) return null;

  async function handleSubmit(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    const templateId = formData.get('templateId')?.toString();
    if (!templateId) {
      setError('Selecciona una plantilla.');
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    // Datos JSON opcionales para rellenar la plantilla. Si el campo está
    // vacío o es JSON inválido, caemos a objeto vacío en lugar de fallar —
    // algunas plantillas no tienen variables.
    const rawData = formData.get('data')?.toString().trim();
    let data: Record<string, unknown> = {};
    if (rawData) {
      try {
        data = JSON.parse(rawData);
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          throw new Error('not an object');
        }
      } catch {
        setError('El campo "Datos JSON" no es un objeto JSON válido. Ejemplo: {"nombre": "EdEma"}');
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }
    }

    const completeAfter = formData.get('completeAfter') === 'on';
    const action = completeAfter ? generateDocumentAndCompleteTask : generateDocumentFromTask;

    try {
      const result = await action(taskId, templateId, data);
      if (!result.success) {
        setError(result.error ?? 'No se pudo generar el documento.');
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }
      // Éxito: el router.refresh() del padre (que escucha mutaciones) o la
      // revalidación de Next harán aparecer el archivo en la sección
      // "Archivos". Cerramos el formulario.
      setOpen(false);
      // Forzar refresh de la ruta para que el nuevo Archivo aparezca.
      window.location.href = returnTo;
    } catch (e: any) {
      if (e?.digest?.startsWith('NEXT_REDIRECT')) return;
      console.error('[GenerateDocumentForm] Error generando documento:', e);
      setError('Error generando el documento. Revisa la consola.');
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <details
      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 mt-1"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-200 select-none">
        📎 Generar documento
      </summary>

      {error && (
        <p className="bg-danger-500/10 border border-danger-500 text-danger-500 rounded px-3 py-2 my-2 text-xs">
          {error}
        </p>
      )}

      <form action={handleSubmit} className="space-y-2 mt-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-xs text-gray-400 sm:w-20">Plantilla</label>
          <select
            name="templateId"
            required
            defaultValue=""
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
          >
            <option value="" disabled>
              Selecciona una plantilla…
            </option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.docType})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <label className="text-xs text-gray-400 sm:w-20 sm:pt-2">Datos JSON</label>
          <div className="flex-1">
            <textarea
              name="data"
              rows={2}
              placeholder='Opcional. Ej: {"nombre": "EdEma", "fecha": "2026-07-18"}'
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-mono"
            />
            <p className="text-gray-500 text-[10px] mt-1">
              DOCX usa <code>{'{nombre}'}</code> · MD usa <code>{'{{nombre}}'}</code>. Vacío = sin
              reemplazos.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
          <input type="checkbox" name="completeAfter" className="h-3 w-3" />
          Marcar la tarea como completada al generar
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="bg-primary-500 px-3 py-1.5 rounded hover:bg-primary-600 transition-colors text-xs disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {submitting ? 'Generando…' : 'Generar documento'}
        </button>
      </form>
    </details>
  );
}
