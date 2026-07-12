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

> **Nota de numeración (actualizada 2026-07-11):** este roadmap se
> renumeró DOS veces. Primero para que Fase 0 = MVP y Fase 1 =
> Priorización coincidieran con lo realmente ejecutado. Segundo, a
> pedido explícito del dueño, para reservar la **Fase 2** (aún sin
> sprints planificados — candidata: "Clasificador de archivos", ver
> `BACKLOG.md`) y mover **Google Drive a Fase 3**. Todo lo que antes era
> Fase 3+ se corrió un lugar: Calendar→4, IA→5, Documentos→6, UX→7,
> Endurecimiento→8. Si esto vuelve a generar confusión entre sesiones,
> el número de fase de CADA sprint activo debe confirmarse contra este
> archivo antes de arrancar, nunca asumirse del prompt.

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

## Fase 2 — Reservada (sin sprints planificados todavía)

Candidata: "Clasificador de archivos" (ver `BACKLOG.md` Medium Priority)
— analizar carpetas locales del usuario y proponer a qué proyecto
pertenece cada archivo, con aprobación manual antes de mover. Esta
carpeta ordenada sería la carpeta madre que se sincroniza con Drive en
la Fase 3. No planificar sprints aquí sin aprobación explícita del
dueño — de momento es solo contexto anotado en el backlog.

---

## Fase 3 — Google Drive: archivos y notas Markdown editables desde la web

### Sprint 3.1 — Carpeta local por proyecto + entidad índice (~4h)
- Alcance: convención `./files/{proyecto}/` en disco. Modelo Prisma que
  indexe archivos/notas (ruta, projectId, título, mimeType, fechas).
  Consultar a `architect` antes de definir el schema exacto.
- Dependencias: Fase 1 completa (ya cumplido).
- DoD: cada proyecto tiene su carpeta local; la app lista su contenido
  desde el índice, verificado en `npm run dev`.

### Sprint 3.2 — OAuth "Desktop app" + refresh token cifrado (~6h)
- Alcance: flujo loopback (`127.0.0.1:puerto`), `access_type=offline`,
  scope `drive.file` (no-sensible, evita verificación pesada de Google),
  token guardado cifrado en SQLite. Config en `.env` (en `.gitignore`,
  nunca commitear claves).
- **Requiere pasos manuales del dueño en Google Cloud Console antes de
  tocar código** (crear proyecto OAuth, habilitar Drive API, credenciales
  tipo "Desktop app", publicar a "In Production" para evitar expiración
  de refresh token a 7 días del modo Testing). No se empieza a programar
  hasta que el dueño confirme que esos pasos están hechos.
- Dependencias: Sprint 3.1.
- DoD: el dueño autoriza una vez con su cuenta de Google y la app
  conserva acceso tras reiniciar `npm run dev` (sin volver a pedir login).
- **Sprint más delicado del proyecto hasta ahora**: si se empieza, se
  termina entero o se deja en estado limpio y revertible — nunca a
  medias con credenciales colgadas.

### Sprint 3.3 — Notas como Markdown en Drive (~6h)
- Alcance: editor Markdown en la app; guardar escribe el `.md` local y lo
  sube vía Drive API; abrir lee el `.md`. Migrar las notas que hoy viven
  en SQLite a este modelo (SQLite queda solo como índice de metadatos).
- Dependencias: Sprint 3.2.
- DoD: crear/editar una nota en la web y el `.md` aparece o se actualiza
  en Drive, verificado abriendo Drive directamente.

### Sprint 3.4 — Subir/crear otros archivos y carpetas en Drive (~4h)
- Alcance: crear carpetas de proyecto en Drive y subir archivos desde la
  web de EMA OS.
- Dependencias: Sprint 3.2.
- DoD: se crea una carpeta de proyecto en Drive y se sube un archivo
  desde la web; verificado en Drive.

### Sprint 3.5 — Espejo bidireccional con rclone bisync (~5h, OPCIONAL)
- Alcance: `rclone bisync` entre la carpeta local y Drive. Primera
  corrida con `--resync` y respaldo previo; flags robustos (`--resilient
  --recover --conflict-resolve newer --drive-skip-gdocs`). Documentar que
  `bisync` está en beta.
- Dependencias: Sprint 3.4.
- DoD: un cambio local aparece en Drive tras sincronizar y viceversa
  (probado en ambas direcciones); procedimiento de resolución manual de
  conflictos documentado en `.claude/docs/ARCHITECTURE.md`.

---

## Fase 4 — Google Calendar como pilar

### Sprint 4.1 — OAuth y verificación del scope sensible de Calendar (~5h)
- Alcance: configurar credenciales OAuth de Google Cloud para el scope de
  Calendar (marcado "sensible", requiere pantalla de consentimiento con
  verificación). Resolver el proceso de verificación/re-autorización
  dentro de este mismo sprint, no dejarlo pendiente.
- Dependencias: Fase 1 completa (ya cumplido).
- DoD: login con Google Calendar funciona en `npm run dev` sin bloqueo de
  "app no verificada" para la cuenta del dueño (verificado con el flujo de
  login real); el estado de verificación queda documentado (aprobado,
  pendiente, o en modo de prueba con usuarios de prueba explícitos).

### Sprint 4.2 — Tarea con fecha/hora crea evento de Calendar (~4h)
- Alcance: al asignar fecha/hora a una tarea en EMA OS, se crea (o
  actualiza) un evento correspondiente en Google Calendar vía la API.
- Dependencias: Sprint 4.1.
- DoD: crear una tarea con fecha/hora en `npm run dev` produce un evento
  visible en calendar.google.com con el mismo título y horario; editar la
  fecha en EMA OS actualiza el evento existente (no crea uno duplicado).

### Sprint 4.3 — Recordatorios configurables 3-5 días antes (~3h)
- Alcance: usar `reminders.overrides` de la API de Calendar para
  configurar recordatorios entre 3 y 5 días antes del evento, con el valor
  configurable por el usuario.
- Dependencias: Sprint 4.2.
- DoD: un evento creado desde EMA OS muestra en Google Calendar un
  recordatorio configurado con el offset elegido (verificado inspeccionando
  el evento en la interfaz de Calendar o vía la API).

---

## Fase 5 — IA con OpenRouter (BYOK)

### Sprint 5.1 — Cliente OpenRouter compatible con OpenAI SDK (~3h)
- Alcance: configurar cliente usando `base_url
  https://openrouter.ai/api/v1` y API key en `.env` (arquitectura BYOK,
  llave del propio usuario). Modelo por defecto: `openrouter/free`.
- Dependencias: Fase 1 completa (ya cumplido).
- DoD: una llamada de prueba (script o endpoint mínimo) recibe respuesta
  exitosa del modelo `openrouter/free` corriendo localmente con
  `npm run dev`; la API key no queda hardcodeada en el código, solo en
  `.env`.

### Sprint 5.2 — Manejo de rate limit (429) con fallback a modelo de pago barato (~4h)
- Alcance: detectar HTTP 429 del pool gratuito y hacer fallback automático
  a un modelo de pago barato usando el saldo ya existente de $10 en la
  cuenta de OpenRouter (no es gasto nuevo). Documentar el límite aproximado
  del tier gratuito (~200 requests/día) como supuesto no garantizado, no
  como constante fija.
- Dependencias: Sprint 5.1.
- DoD: forzando o simulando una respuesta 429, el sistema reintenta con el
  modelo de fallback y la petición del usuario se completa igual
  (verificado con una prueba manual o un mock del error 429).

### Sprint 5.3 — Primera integración de IA visible en la UI (~5h)
- Alcance: una función concreta y acotada que use IA (ej. sugerencia del
  "Next Action" de un proyecto, o resumen de una nota) — el alcance exacto
  se decide en el momento según lo que el dueño apruebe explícitamente, sin
  exceder una sola función por sprint.
- Dependencias: Sprint 5.2.
- DoD: la función de IA elegida produce una respuesta visible en la UI
  usando datos reales del proyecto, probada en `npm run dev`.

---

## Fase 6 — Documentos automáticos

### Sprint 6.1 — Generación de .docx desde plantillas (docxtemplater) (~5h)
- Alcance: plantilla `.docx` con variables reemplazables por datos reales
  de un proyecto/tarea, usando `docxtemplater`.
- Dependencias: Fase 1 completa (ya cumplido).
- DoD: generar un documento desde la UI produce un `.docx` descargable con
  las variables sustituidas correctamente por datos reales (abierto y
  verificado manualmente).

### Sprint 6.2 — Generación de PDF desde Markdown (md-to-pdf) (~3h)
- Alcance: exportar una nota o plantilla Markdown a PDF usando
  `md-to-pdf`.
- Dependencias: Fase 3 (notas como archivos Markdown reales).
- DoD: exportar una nota real produce un `.pdf` legible con el contenido
  correcto (abierto y verificado manualmente).

---

## Fase 7 — UX avanzada

### Sprint 7.1 — Command palette con `cmdk` (~4h)
- Alcance: paleta de comandos accesible con atajo de teclado, con acciones
  básicas de navegación (ir a proyectos, tareas, notas, dashboard, my day).
- Dependencias: Fase 1 completa (ya cumplido).
- DoD: abrir la paleta con el atajo definido y ejecutar al menos una
  acción de navegación funciona en `npm run dev`.

### Sprint 7.2 — Atajos de teclado globales (~3h)
- Alcance: atajos para acciones frecuentes (crear tarea rápida, abrir
  inbox de captura).
- Dependencias: Sprint 7.1.
- DoD: cada atajo documentado se probó manualmente en el navegador y
  ejecuta la acción esperada sin conflicto con atajos del navegador.

### Sprint 7.3 — Optimistic UI en mutaciones (~4h)
- Alcance: las mutaciones de tareas/notas/proyectos actualizan la UI de
  inmediato antes de confirmar la respuesta del servidor, con reversión si
  falla.
- Dependencias: Fase 1 completa (CRUD real ya en las 3 entidades).
- DoD: en `npm run dev`, con throttling de red simulado (DevTools), la UI
  refleja el cambio antes de que la petición termine, y revierte
  correctamente si se fuerza un error del servidor.

### Sprint 7.4 — Inbox de captura rápida (~4h)
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

## Fase 8 — Endurecimiento y pulido final

### Sprint 8.1 — Configuración mínima de usuario (~3h)
- Alcance: pantalla de configuración con las preferencias mínimas del MVP
  original (tema, preferencias básicas) — sin exceder lo ya aprobado.
- Dependencias: Fase 1 completa (ya cumplido).
- DoD: un cambio de configuración en `npm run dev` persiste tras recargar
  la página (verificado en `emaos.db` o almacenamiento local, según se
  implemente).

### Sprint 8.2 — Revisión de rendimiento y limpieza final (~4h)
- Alcance: revisar queries N+1 evidentes, imports muertos, y consistencia
  general del código antes de considerar el sistema estable para uso
  diario.
- Dependencias: todas las fases anteriores completas.
- DoD: `npm run build` y `npx tsc --noEmit` pasan limpio; no quedan
  `TODO`, `// @ts-ignore` nuevos, ni código duplicado detectado en
  revisión manual del `reviewer`.

---

## Fase 9 — Interactividad y navegación conectada

> Añadida 2026-07-12 a pedido directo del dueño, tras usar la app en serio
> y encontrar fricciones reales de navegación (tarjetas no clicables,
> "Siguientes acciones" sin destino exacto, /projects sin detalle). No
> reemplaza ni reordena las Fases 0-8 existentes — se ejecuta en paralelo/
> después según el dueño decida sesión a sesión.

### Sprint 9.1 — Página de detalle de proyecto `/projects/[id]` (~5h) ✅ COMPLETA
- Alcance: ruta dinámica con nombre, descripción/estado, nota(s) de
  contexto Markdown renderizada(s) (0..N, Sprint 3.3), todas las tareas del
  proyecto con prioridad/estado editables inline, Next Action destacada,
  archivos de Drive del proyecto.
- Dependencias: Fase 1, Fase 3, Fase 7 (Sprint 7.3, patrón optimistic UI)
  completas.
- DoD: clic en un proyecto desde el dashboard → toda la info de ese
  proyecto en una sola página, verificado en navegador. Cumplido.

### Sprint 9.2 — Navegación conectada en todo el dashboard (~3h) ✅ COMPLETA
- Alcance: tarjetas de proyecto → `/projects/[id]`; cada "Siguiente
  acción" → `/projects/[id]` exacto (no `/projects` genérico); menciones
  de proyecto en My Day/Inbox/Tasks enlazan a su detalle.
- Dependencias: Sprint 9.1.
- DoD: desde el dashboard se llega a cualquier proyecto o tarea en un
  clic, verificado en navegador. Cumplido.

### Sprint 9.3 — Eliminar pestaña /notes, migrar a detalle de proyecto (~3h) ✅ COMPLETA
- Alcance: quitar la ruta `/notes` y su entrada de sidebar; el contenido
  de contexto se muestra/edita desde `/projects/[id]` (ya construido en
  9.1). Las notas NO se borran (siguen en Drive + índice SQLite).
- Dependencias: Sprint 9.1.
- Regla dura: verificar que el 100% de notas son accesibles desde el
  detalle de proyecto ANTES de borrar la ruta. Si hay una nota huérfana,
  parar y documentar en SPRINT.md en vez de continuar.
- DoD: no existe `/notes`; todo su contenido accesible desde proyectos;
  cero notas perdidas (verificado contra BD e índice de Drive). Cumplido
  — 9 notas reales, 0 huérfanas (garantía estructural: `Archivo.projectId`
  no-nulo), no hizo falta migración de datos.

### Sprint 9.4 — Dashboard con resúmenes y filtros (~4h)
- Alcance: tarjetas de resumen (activos, tareas abiertas, tareas de hoy,
  próximas fechas límite); filtro de "Siguientes acciones" por proyecto/
  prioridad/fecha; orden seleccionable. Sin librerías nuevas de UI.
- Dependencias: Sprint 9.2.
- DoD: filtrar y reordenar las siguientes acciones, verificado en
  navegador con datos reales.

### Sprint 9.5 — Micro-interactividad (~3h, opcional/si sobra presupuesto)
- Alcance: editar estado y prioridad de una tarea desde el dashboard y
  desde `/projects/[id]` con optimistic UI (patrón de Fase 7), sin salir
  de la vista actual.
- Dependencias: Sprint 9.1 (ya cumple esto dentro del detalle), 9.2.
- DoD: cambiar el estado de una tarea sin salir de la vista actual.

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
- No usar APIs no oficiales ni scraping de WhatsApp (viola términos de
  servicio y arriesga baneo del número) — cualquier integración con
  WhatsApp es solo vía archivos exportados manualmente por el usuario.
- No agregar funcionalidades no solicitadas, aunque parezcan una mejora
  natural (regla de `CLAUDE.md`).

---

## Riesgos y advertencias técnicas conocidas

- **OpenRouter pool gratuito (`openrouter/free`):** el auto-router rota
  entre modelos dentro del pool y tiene límites de uso (aproximadamente
  ~200 requests/día en el tier gratuito, cifra no garantizada por
  OpenRouter). El sistema debe tolerar cambios de modelo y agotamiento de
  cuota, nunca asumir un modelo fijo ni una cuota fija — de ahí el
  fallback obligatorio del Sprint 5.2.
- **`rclone bisync` está en beta:** posibilidad real de conflictos de
  sincronización no resueltos automáticamente entre la carpeta local y
  Google Drive. No tratarlo como 100% confiable; documentar el
  procedimiento manual de resolución de conflictos (Sprint 3.5).
- **Scope de Calendar es "sensible" (no "restringido"):** requiere
  pantalla de consentimiento con verificación de Google, lo cual puede
  tardar. Debe resolverse dentro del Sprint 4.1, no postergarse, porque
  bloquea toda la Fase 4 si queda pendiente.
- **Sprint 3.2 (OAuth Drive) requiere pasos manuales del dueño en Google
  Cloud Console** antes de escribir código — ver detalle en la Fase 3.
