# ROADMAP.md — EMA OS

## Principio rector (no negociable): gasto adicional = $0

Toda decisión de este roadmap está subordinada a esta restricción. Todo lo
nuevo debe ser open source o self-hosted. Ninguna función puede depender de
un servicio de pago recurrente (suscripciones mensuales, planes pagos
obligatorios). Las únicas excepciones documentadas son saldo ya comprado
(los $10 de crédito existentes en OpenRouter, no gasto nuevo) y servicios
con tier gratuito suficiente para un solo usuario (Google Drive API,
Google Calendar API, OpenRouter free pool). Si una fase o sprint no puede
cumplir esto, no se implementa, se anota en `.claude/docs/BACKLOG.md` y se
espera aprobación explícita del dueño.

**Recordatorio de identidad** (ver skill `ema-os`): EMA OS es un
organizador personal para un único usuario (Eduardo). No es un ERP, ni un
CRM, ni software multiusuario.

**Regla de verificación** (ver skill `project-memory` y
`definition-of-done`): ningún sprint se marca como completado sin cumplir
el checklist de Definition of Done — compilar de verdad (`npm run build`),
ejecutarse de verdad (`npm run dev` y probarlo, o consultar la base de
datos), y sin dejar código duplicado ni placeholders falsos. La
documentación de estado (`SPRINT.md`, `BACKLOG.md`, este `ROADMAP.md`) se
actualiza en el mismo cambio que cierra el sprint, reflejando el estado
real verificado, no el deseado.

> **Nota de numeración (2026-07-11):** este roadmap se renumeró para que
> coincida con lo que de verdad se ejecutó en sesión (antes tenía "Fase 1"
> para cerrar el MVP y arrancaba ahí; en la práctica se trabajó como
> **Fase 0 = MVP** y **Fase 1 = Priorización**, y así queda fijado de aquí
> en adelante). "Next Action" y "My Day" se movieron de la antigua Fase 6
> a la Fase 1, porque ya se construyeron ahí.

---

## Fase 0 — Cerrar el MVP existente ✅ COMPLETA

Dashboard, Proyectos, Tareas y Notas conectados de verdad a la base de
datos, con singleton único de Prisma (`app/lib/db.ts`,
`@prisma/adapter-better-sqlite3`).

- Sprint 0.1 — Consolidar schema Prisma y migrar. ✅
- Sprint 0.2 — Conectar Proyectos a la BD. ✅
- Sprint 0.3 — Conectar Tareas a la BD. ✅
- Sprint 0.4 — Conectar Notas a la BD. ✅
- Sprint 0.5 — Dashboard con datos reales. ✅

## Fase 1 — Núcleo de priorización "¿qué hago ahora?" ✅ COMPLETA

- Sprint 1.1 — Next Action por proyecto (`Proyecto.nextActionTaskId`). ✅
- Sprint 1.2 — Vista consolidada de Next Actions en el dashboard. ✅
- Sprint 1.3 — Prioridad editable + ordenamiento (`Tarea.priority`,
  sin campo nuevo — reuso decidido por `architect`). ✅
- Sprint 1.4 — Vista "My Day" (`Tarea.plannedFor`, rollover manual). ✅
- Sprint 1.5 — Orden sugerido automático (score: prioridad + cercanía de
  deadline + antigüedad). **OPCIONAL, pendiente** (ver `BACKLOG.md`).

---

## Fase 2 — Notas Markdown + sincronización con Google Drive

### Sprint 2.1 — Notas como archivos Markdown en disco (~5h)
- Alcance: migrar el almacenamiento de contenido de notas de SQLite a
  archivos `.md` organizados en carpetas por proyecto en el filesystem
  local. SQLite pasa a guardar solo el índice de metadatos (ruta, título,
  fecha) — nunca el contenido completo.
- Dependencias: Fase 1 completa (ya cumplido).
- DoD: `npm run build` sin errores; crear una nota en la UI produce un
  archivo `.md` real en la carpeta del proyecto correspondiente (verificado
  con el explorador de archivos), y `emaos.db` solo contiene el
  metadato/índice, no el cuerpo del texto.

### Sprint 2.2 — Editor Markdown en la web de EMA OS (~4h)
- Alcance: la página de notas permite editar el contenido del `.md` desde
  el navegador (lectura y escritura sobre el archivo real en disco).
- Dependencias: Sprint 2.1.
- DoD: editar una nota en `npm run dev` modifica el archivo `.md` en disco
  (confirmado abriéndolo fuera de la app); recargar la página muestra el
  contenido actualizado.

### Sprint 2.3 — Integración con Google Drive API (scope `drive.file`) (~6h)
- Alcance: configurar OAuth con scope `drive.file` (acceso limitado solo a
  archivos creados por la app, sin verificación sensible de Google). Subida
  inicial de la carpeta de notas a Drive.
- Dependencias: Sprint 2.1 (necesita que las notas ya sean archivos reales
  en disco).
- DoD: tras autenticar con una cuenta de Google de prueba, una nota creada
  localmente aparece en Google Drive dentro de la carpeta correspondiente
  (verificado abriendo drive.google.com).

### Sprint 2.4 — rclone bisync para sincronización continua (~5h)
- Alcance: configurar `rclone bisync` entre la carpeta local de notas y la
  carpeta remota de Drive, documentando que `rclone bisync` está en beta
  (riesgo de conflictos de sincronización no resueltos automáticamente).
- Dependencias: Sprint 2.3.
- DoD: un cambio hecho localmente aparece reflejado en Drive tras correr
  la sincronización, y viceversa (probado en ambas direcciones); el
  procedimiento de resolución manual de conflictos queda documentado en
  `.claude/docs/ARCHITECTURE.md`.

---

## Fase 3 — Google Calendar como pilar

### Sprint 3.1 — OAuth y verificación del scope sensible de Calendar (~5h)
- Alcance: configurar credenciales OAuth de Google Cloud para el scope de
  Calendar (marcado "sensible", requiere pantalla de consentimiento con
  verificación). Resolver el proceso de verificación/re-autorización
  dentro de este mismo sprint, no dejarlo pendiente.
- Dependencias: Fase 1 completa (ya cumplido).
- DoD: login con Google Calendar funciona en `npm run dev` sin bloqueo de
  "app no verificada" para la cuenta del dueño (verificado con el flujo de
  login real); el estado de verificación queda documentado (aprobado,
  pendiente, o en modo de prueba con usuarios de prueba explícitos).

### Sprint 3.2 — Tarea con fecha/hora crea evento de Calendar (~4h)
- Alcance: al asignar fecha/hora a una tarea en EMA OS, se crea (o
  actualiza) un evento correspondiente en Google Calendar vía la API.
- Dependencias: Sprint 3.1.
- DoD: crear una tarea con fecha/hora en `npm run dev` produce un evento
  visible en calendar.google.com con el mismo título y horario; editar la
  fecha en EMA OS actualiza el evento existente (no crea uno duplicado).

### Sprint 3.3 — Recordatorios configurables 3-5 días antes (~3h)
- Alcance: usar `reminders.overrides` de la API de Calendar para
  configurar recordatorios entre 3 y 5 días antes del evento, con el valor
  configurable por el usuario.
- Dependencias: Sprint 3.2.
- DoD: un evento creado desde EMA OS muestra en Google Calendar un
  recordatorio configurado con el offset elegido (verificado inspeccionando
  el evento en la interfaz de Calendar o vía la API).

---

## Fase 4 — IA con OpenRouter (BYOK)

### Sprint 4.1 — Cliente OpenRouter compatible con OpenAI SDK (~3h)
- Alcance: configurar cliente usando `base_url
  https://openrouter.ai/api/v1` y API key en `.env` (arquitectura BYOK,
  llave del propio usuario). Modelo por defecto: `openrouter/free`.
- Dependencias: Fase 1 completa (ya cumplido).
- DoD: una llamada de prueba (script o endpoint mínimo) recibe respuesta
  exitosa del modelo `openrouter/free` corriendo localmente con
  `npm run dev`; la API key no queda hardcodeada en el código, solo en
  `.env`.

### Sprint 4.2 — Manejo de rate limit (429) con fallback a modelo de pago barato (~4h)
- Alcance: detectar HTTP 429 del pool gratuito y hacer fallback automático
  a un modelo de pago barato usando el saldo ya existente de $10 en la
  cuenta de OpenRouter (no es gasto nuevo). Documentar el límite aproximado
  del tier gratuito (~200 requests/día) como supuesto no garantizado, no
  como constante fija.
- Dependencias: Sprint 4.1.
- DoD: forzando o simulando una respuesta 429, el sistema reintenta con el
  modelo de fallback y la petición del usuario se completa igual
  (verificado con una prueba manual o un mock del error 429).

### Sprint 4.3 — Primera integración de IA visible en la UI (~5h)
- Alcance: una función concreta y acotada que use IA (ej. sugerencia del
  "Next Action" de un proyecto, o resumen de una nota) — el alcance exacto
  se decide en el momento según lo que el dueño apruebe explícitamente, sin
  exceder una sola función por sprint.
- Dependencias: Sprint 4.2.
- DoD: la función de IA elegida produce una respuesta visible en la UI
  usando datos reales del proyecto, probada en `npm run dev`.

---

## Fase 5 — Documentos automáticos

### Sprint 5.1 — Generación de .docx desde plantillas (docxtemplater) (~5h)
- Alcance: plantilla `.docx` con variables reemplazables por datos reales
  de un proyecto/tarea, usando `docxtemplater`.
- Dependencias: Fase 1 completa (ya cumplido).
- DoD: generar un documento desde la UI produce un `.docx` descargable con
  las variables sustituidas correctamente por datos reales (abierto y
  verificado manualmente).

### Sprint 5.2 — Generación de PDF desde Markdown (md-to-pdf) (~3h)
- Alcance: exportar una nota o plantilla Markdown a PDF usando
  `md-to-pdf`.
- Dependencias: Fase 2 (notas como archivos Markdown reales).
- DoD: exportar una nota real produce un `.pdf` legible con el contenido
  correcto (abierto y verificado manualmente).

---

## Fase 6 — UX avanzada

### Sprint 6.1 — Command palette con `cmdk` (~4h)
- Alcance: paleta de comandos accesible con atajo de teclado, con acciones
  básicas de navegación (ir a proyectos, tareas, notas, dashboard, my day).
- Dependencias: Fase 1 completa (ya cumplido).
- DoD: abrir la paleta con el atajo definido y ejecutar al menos una
  acción de navegación funciona en `npm run dev`.

### Sprint 6.2 — Atajos de teclado globales (~3h)
- Alcance: atajos para acciones frecuentes (crear tarea rápida, abrir
  inbox de captura).
- Dependencias: Sprint 6.1.
- DoD: cada atajo documentado se probó manualmente en el navegador y
  ejecuta la acción esperada sin conflicto con atajos del navegador.

### Sprint 6.3 — Optimistic UI en mutaciones (~4h)
- Alcance: las mutaciones de tareas/notas/proyectos actualizan la UI de
  inmediato antes de confirmar la respuesta del servidor, con reversión si
  falla.
- Dependencias: Fase 1 completa (CRUD real ya en las 3 entidades).
- DoD: en `npm run dev`, con throttling de red simulado (DevTools), la UI
  refleja el cambio antes de que la petición termine, y revierte
  correctamente si se fuerza un error del servidor.

### Sprint 6.4 — Inbox de captura rápida (~4h)
- Alcance: vista/campo para capturar ideas o tareas sueltas sin asignarlas
  a un proyecto todavía, con opción de clasificarlas después.
- Dependencias: Fase 1 completa (ya cumplido).
- DoD: crear un ítem en el inbox desde `npm run dev` lo persiste en
  `emaos.db` sin proyecto asignado, y puede moverse después a un proyecto
  real (verificado en la UI y en la base de datos).

> Nota: "Vista My Day con rollover" y "Next Action visible por proyecto"
> ya NO están en esta fase — se construyeron en la Fase 1 (Sprints 1.1 y
> 1.4) y quedaron completas ahí.

---

## Fase 7 — Endurecimiento y pulido final

### Sprint 7.1 — Configuración mínima de usuario (~3h)
- Alcance: pantalla de configuración con las preferencias mínimas del MVP
  original (tema, preferencias básicas) — sin exceder lo ya aprobado.
- Dependencias: Fase 1 completa (ya cumplido).
- DoD: un cambio de configuración en `npm run dev` persiste tras recargar
  la página (verificado en `emaos.db` o almacenamiento local, según se
  implemente).

### Sprint 7.2 — Revisión de rendimiento y limpieza final (~4h)
- Alcance: revisar queries N+1 evidentes, imports muertos, y consistencia
  general del código antes de considerar el sistema estable para uso
  diario.
- Dependencias: todas las fases anteriores completas.
- DoD: `npm run build` y `npx tsc --noEmit` pasan limpio; no quedan
  `TODO`, `// @ts-ignore` nuevos, ni código duplicado detectado en
  revisión manual del `reviewer`.

---

## Qué NO hacer

- No convertir EMA OS en un ERP.
- No convertir EMA OS en un CRM.
- No agregar soporte multiusuario ni multi-tenant — es una herramienta
  personal de un solo dueño.
- No depender de ningún servicio de pago recurrente (suscripción mensual u
  obligatoria). Cualquier excepción requiere aprobación explícita del
  dueño y se documenta como tal.
- No usar Ollama — el hardware del usuario es insuficiente para correrlo
  localmente; la vía de IA es OpenRouter (BYOK).
- No usar Google Keep — su API solo aplica a cuentas Google Workspace
  (enterprise), no a un usuario individual.
- No agregar funcionalidades no solicitadas, aunque parezcan una mejora
  natural (regla de `CLAUDE.md`).

---

## Riesgos y advertencias técnicas conocidas

- **OpenRouter pool gratuito (`openrouter/free`):** el auto-router rota
  entre modelos dentro del pool y tiene límites de uso (aproximadamente
  ~200 requests/día en el tier gratuito, cifra no garantizada por
  OpenRouter). El sistema debe tolerar cambios de modelo y agotamiento de
  cuota, nunca asumir un modelo fijo ni una cuota fija — de ahí el
  fallback obligatorio del Sprint 4.2.
- **`rclone bisync` está en beta:** posibilidad real de conflictos de
  sincronización no resueltos automáticamente entre la carpeta local y
  Google Drive. No tratarlo como 100% confiable; documentar el
  procedimiento manual de resolución de conflictos (Sprint 2.4).
- **Scope de Calendar es "sensible" (no "restringido"):** requiere
  pantalla de consentimiento con verificación de Google, lo cual puede
  tardar. Debe resolverse dentro del Sprint 3.1, no postergarse, porque
  bloquea toda la Fase 3 si queda pendiente.
