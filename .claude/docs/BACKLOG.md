# BACKLOG.md — Items abiertos

## Alta prioridad

- [ ] **Sprint 1.5 (OPCIONAL)** — orden sugerido automático en /tasks y /my-day.
  Extender `app/lib/sort.ts` con score: prioridad + deadline + antigüedad.

- [ ] **Seguridad — prerrequisito antes de despliegue remoto.** La app no tiene
  autenticación. Mono-usuario local, aceptable hoy. Si se expone por Tailscale
  o nube: implementar NextAuth ANTES de cualquier otra funcionalidad.

- [ ] **Inventarista (Fase 11)** — vista de inventario + agente comparador.
  Columnas sugeridas: artículo, cantidad, ubicación, estado, foto. Schema sin
  definir — consultar `architect` antes de tocar Prisma. Pendiente de que el
  dueño entregue el inventario manual de Xalma para saber qué campos necesita.

## Media prioridad (deuda técnica no bloqueante)

- [ ] `PENDING_CONFIRMATIONS` en memoria (`app/api/chat/route.ts`) — asunción
  de proceso único no documentada en `ARCHITECTURE.md`. Riesgo de disponibilidad,
  no de seguridad. Documentar cuando se toque ese archivo.

- [ ] `crearTarea` puede invocar `createTask` con args fuera de su contrato de
  formulario (`app/lib/assistant-tools.ts`). Parcialmente mitigado; catch genérico
  enmascara errores de redirect interno.

- [ ] Borrar Proyecto con Tareas/Notas falla por FK (desde Sprint 0.2). Considerar
  `onDelete: Cascade` o mensaje guía.

- [ ] `Tarea.dueDate` puede desfasarse 1 día en bordes de zona horaria (UTC vs.
  local). Afecta `/calendar`. Arreglo: `new Date(y, m-1, d)` en lugar de
  `new Date(string)`.

- [ ] `app/lib/files.ts` — sin guard de formato `cuid()` en `projectId` antes de
  `path.join`. Seguro hoy, riesgo potencial de path traversal si se usa con otro
  origen de id.

- [ ] Callback OAuth sin parámetro `state` (CSRF, RFC 6749). Marginal en localhost.

- [ ] Mutex de mutación de tarea no unificado entre `TaskCard.tsx` y
  `TaskPriorityShortcut.tsx` (atajo "P"). No bloqueante.

- [ ] `MARKDOWN_MIME` duplicado en `notes.ts` y `google-drive-files.ts`.

- [ ] Layout móvil roto en algunas páginas (confirmado Poco F7 Pro, 2026-07-13).
  Pendiente de detalle del dueño antes de diagnosticar.

- [ ] Sprint 3.5 (OPCIONAL) — rclone bisync bidireccional. **Requiere sesión
  supervisada** (rclone bisync en beta, riesgo real de pérdida de datos).

## Tailscale (acceso remoto)

- [ ] Bug: al activar VPN en el teléfono pierde internet general. Causa probable:
  "usar como exit node" o "Override local DNS" activo. Diagnóstico pendiente con
  el dueño. Hasta resolverlo, no recomendar Tailscale como acceso remoto.

## Ideas futuras (post-Fase 6)

- [ ] Hermes como canal Telegram — Hermes ya instalado. Integración EMA OS ↔ Hermes
  pendiente de sesión CON supervisión. EMA OS = cerebro, Hermes = canal.
  Ver `.claude/docs/MCP_HERMES.md` para el punto de inicio.

- [ ] Clasificador de archivos (candidato Fase 2) — analizar carpetas acotadas del
  disco y proponer a qué proyecto pertenece cada archivo. Aprobación manual antes
  de mover. Sin sprints todavía.

- [ ] Importar chat de WhatsApp exportado (`.txt` manual, sin APIs no oficiales).

## Descartado

- ~~Dark/light theme toggle~~ — app dark-only por decisión de diseño (`ui-guidelines`).

---
> Al superar 100 líneas: rotar lo viejo a `.claude/docs/archive/BACKLOG_HISTORICO.md`
> (copia ciega, sin resumir). Historial completo en ese archivo.
