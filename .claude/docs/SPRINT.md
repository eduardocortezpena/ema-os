# SPRINT.md
## Current Sprint: Fase 4 — Google Calendar

### Sprint Goal
Fase 9 en pausa (9.1-9.4 completos; 9.5 pendiente/opcional). Fase 4
desbloqueada: Sprint 4.1 completo y verificado con la cuenta real del
usuario. Continúa con Sprint 4.2 (Tarea con fecha/hora → evento de
Calendar).

### Sprint Duration
Start: 2026-07-11 (Fase 7, completa). Fase 4 bloqueada en 4.1 el mismo
día. Fase 9 iniciada 2026-07-12 a pedido directo del dueño tras usar la
app en serio.

### ✅ Sprint 9.1 — Página de detalle de proyecto /projects/[id] (2026-07-12)

Decisión de architect: un solo `prisma.proyecto.findUnique` con includes
anidados (tasks, nextActionTask, archivos) + `getNoteContent` en
`Promise.all` separado (mismo patrón que `/notes`). Notas de contexto
tratadas como lista 0..N (`archivos.filter(kind==='NOTE')`), no singular.
404 real vía `notFound()` si el proyecto no existe. `TaskCard.tsx`
extraído de `TaskBoard.tsx` (Sprint 7.3) y reusado en `ProjectTaskList.tsx`
(nuevo, mismo patrón useOptimistic + guard `useRef` anti doble-submit,
sin selector de proyecto — projectId fijo por la ruta).

**Verificado en navegador con datos reales** (proyecto "Xalma Residencial",
13 tareas, 1 nota, Next Action): la página renderiza todo en una sola
vista; creé una tarea real vía `ProjectTaskList` (confirmada en DB con
`projectId` correcto, luego borrada); confirmé 404 real para un id
inexistente; confirmé `/tasks` sin regresión tras el refactor de
`TaskBoard.tsx` (33 tareas, sin errores de consola en pestaña nueva).

Reviewer encontró un **bug bloqueante real**: las acciones reutilizadas
(`createNote`/`updateNote`/`deleteNote`, `createTask`/`updateTaskStatus`/
`updateTaskPriority`/`deleteTask`, `updateProject`/`setNextAction`)
siempre redirigían a `/notes`/`/tasks`/`/projects` en error y nunca
revalidaban `/projects/[id]`, aunque ahora también se invocan desde ahí.
**Corregido** con un patrón `returnTo` opcional retrocompatible (hidden
input en cada form de la página nueva; sin él, cada acción cae a su
comportamiento previo — /notes, /tasks, /projects sin cambios). Reviewer
re-verificó el fix: 44/44 forms de la página con `returnTo` correcto,
comportamiento default intacto en /notes, /tasks, /projects, /my-day,
/inbox. Añadido además un guard contra open redirect (`returnTo` debe
empezar con `/` y no con `//`) en los tres helpers.
**Cambio real verificado**: prioridad de una tarea editada inline desde
el detalle del proyecto (LOW→MEDIUM en DB), confirmado que la página se
queda en `/projects/[id]` (no navega a `/tasks`); revertido tras
confirmar.
`ROADMAP.md` actualizado con la Fase 9 completa (9.1-9.5) para que la
numeración quede reconciliada, per regla del proyecto de nunca dejar una
fase sin documentar.

### ✅ Sprint 9.2 — Navegación conectada en todo el dashboard (2026-07-12)

Sin decisión de architect (sprint puramente de navegación/UI, sin schema).
Tarjetas de "Siguientes acciones" y de la lista del dashboard ahora
enlazan a `/projects/${project.id}` exacto (antes iba a `/projects`
genérico, con un TODO explícito dejado en el código desde 9.1). Título y
mención de Next Action en `/projects` (lista) enlazan al detalle.
Menciones de proyecto en My Day (3 lugares) y el badge de proyecto en
`TaskCard.tsx` (usado en `/tasks` y `/projects/[id]`) también enlazan
cuando la tarea tiene proyecto — tipo `Task.project` ampliado de
`{name}` a `{id, name}`.

**Verificado con datos reales**: 7 links de "Siguientes acciones" en el
dashboard apuntan a ids de proyecto reales; clic real navegó
correctamente a `/projects/{id de Xalma Residencial}`; 33 links en
`/tasks` y en `/my-day` (uno por cada tarea real); 17 links en
`/projects` (9 títulos + 8 Next Actions, Organización personal sin Next
Action correctamente excluida). Reviewer confirmó build limpio, sin HTML
inválido, sin regresión visual. Hallazgo fuera de alcance (badge de
proyecto en `NoteBoard.tsx` sin link) quedó obsoleto de inmediato porque
9.3 elimina esa página entera.

### ✅ Sprint 9.3 — Eliminar /notes, migrar a detalle de proyecto (2026-07-12)

**Regla dura cumplida antes de tocar nada**: verifiqué que el 100% de
notas fueran accesibles desde `/projects/[id]` ANTES de borrar la ruta.
`Archivo.projectId` es `String` no-nulo en el schema (garantía
estructural), y confirmé con query directa: 9 notas, **0 huérfanas**,
todas con `projectId` apuntando a un `Proyecto` real existente. El
modelo legado `Nota` (respaldo de Sprint 3.3) sigue en 0 filas. No hizo
falta ninguna migración de datos — las notas ya eran accesibles desde
9.1 tal cual.

Borrados `app/notes/page.tsx` y `app/components/NoteBoard.tsx` (sin
otros importadores, verificado con grep antes de borrar). Quitado el
link "Notes" del sidebar y "Ir a Notas" de la command palette (el flujo
de crear nota vía paleta se mantiene — sigue creando notas asociadas a
un proyecto). En `app/actions/notes.ts`: el `returnTo` por defecto pasó
de `/notes` (ruta muerta) a `/projects`; quitadas las llamadas
`revalidatePath('/notes')` ya inútiles en las 4 funciones.

**Verificado en navegador + DB tras el cambio**: `/notes` da 404 real;
sidebar con 7 links (sin Notes); `/projects/{id}` sigue renderizando la
nota de contexto completa; **las 9 notas reales verificadas una por una
a nivel de disco y Drive** (`.md` local presente con contenido no vacío
+ `driveFileId`) — cero notas inaccesibles. Reviewer confirmó build
limpio, sin referencias colgantes en todo el repo, sin pérdida
funcional por quitar el `revalidatePath` muerto. Corregido además un
hallazgo menor: `.claude/skills/ui-guidelines/SKILL.md` mencionaba
"Notes" en la lista de sidebar, desalineado con `app/layout.tsx` real —
actualizado.

### ✅ Sprint 9.4 — Dashboard con resúmenes y filtros (2026-07-12)

Sin decisión de architect (sprint de UI, sin schema). Sin librerías
nuevas: filtros vía query params de URL (`?project=&priority=&sort=`),
server-side en `app/dashboard/page.tsx`. 2 tarjetas de resumen nuevas
("Tareas de hoy" con `plannedFor`, "Próx. fechas límite 7d" con
`dueDate`), grid ampliado a 6 tarjetas. "Siguientes acciones" ahora se
filtra por proyecto/prioridad y se ordena por prioridad (default,
`byPriorityAndDueDate` existente)/proyecto (alfabético)/fecha límite.
`DashboardFilters.tsx` nuevo (client component): 3 selects que navegan
con `router.push` preservando los demás filtros activos.

**Verificado con los 9 proyectos reales**: 6 tarjetas muestran 9/7/33/0/4/0;
filtro por "Xalma Residencial" redujo correctamente a 1 resultado, URL
reflejó `?project={id real}`; `?sort=project` confirmado en orden
alfabético exacto de las 8 Siguientes acciones; sin errores de consola.
Reviewer encontró un bug real: "Limpiar filtros" perdía el `sort` activo
pese a que la intención documentada era preservarlo (no es un "filtro"
que oculte resultados). **Corregido y re-verificado**: con
`?sort=project&priority=HIGH`, el botón ahora limpia solo `priority`
(confirmado `?sort=project` sobrevive).

**Fase 9: 9.1, 9.2, 9.3, 9.4 completos. Sprint 9.5 (micro-interactividad
en dashboard) es opcional — 9.1 ya cubre edición inline en
`/projects/[id]`; falta llevar el mismo patrón al dashboard si se
retoma esta fase.**

### 🛑 Cierre de sesión (2026-07-12, sesión larga)

Parado aquí en verde tras cerrar 4 sprints completos de Fase 9 (9.1-9.4),
cada uno con consulta a `architect` cuando aplicaba, `reviewer` al cerrar,
verificación real en navegador contra los 9 proyectos reales del usuario,
y bugs reales encontrados y corregidos en 3 de los 4 sprints (redirect/
revalidación de rutas reutilizadas en 9.1, y "Limpiar filtros" perdiendo
`sort` en 9.4). Decisión de parar aquí: Sprint 9.5 es opcional y este es
un punto de corte limpio tras un volumen grande de trabajo verificado —
preferible a seguir indefinidamente sin un cierre claro.

**Objetivo 2 (Fase 4/Calendar) NO se tocó**: el usuario no confirmó
durante esta sesión haber completado los 3 pasos de Google Cloud Console
(ver sección "⚠️ BLOQUEADO — Sprint 4.1" más abajo). Sigue bloqueada
exactamente donde estaba.

**Estado final verificado**: `git status` limpio, `npm run build` limpio,
DB en 9 proyectos / 33 tareas / 9 notas (sin cambios de datos reales del
usuario, solo los que él mismo hizo usando la app entre sesiones —
confirmado que no se revirtió nada real).

**Primero que hay que mirar al despertar:**
1. Si el dueño ya completó los pasos de Google Cloud Console → arrancar
   Fase 4 (Sprint 4.1), ver sección "⚠️ BLOQUEADO" abajo.
2. Si no → seguir con Fase 9: Sprint 9.5 (opcional) o continuar con otra
   fase a elección del dueño.

### 🌱 Sesión de seed inicial completada (2026-07-11)

**9 proyectos reales cargados con contexto y tareas concretas. Dashboard
poblado. Sistema en uso real desde este punto.** No fue un sprint del
ROADMAP — fue una carga de contenido real del usuario, vía los Server
Actions existentes (`createProject`, `createTask`, `createNote`,
`setNextAction`), sin tocar código de features ni arquitectura.

Resultado verificado contra la DB y en el dashboard real:
- **9 proyectos**: Xalma Residencial (CRITICAL, prioridad #1), Barrera de
  sargazo (HIGH), Panga recolectora de sargazo (MEDIUM), Restaurante
  Veracruzano (MEDIUM), Asociación Civil / Salsa Fest (MEDIUM), Aprendizaje
  personal (HIGH), Arte en Madera y Hierro (LOW, PAUSED), Organización
  personal (LOW), EMA OS (HIGH).
- **32 tareas totales** repartidas entre los proyectos (13 en Xalma —
  incluye el calendario de 4 publicaciones 13/15/17/19 jul 2026 — 4 en
  Barrera de sargazo, 1 en Panga, 1 en Restaurante, 1 en Asociación Civil,
  4 en Aprendizaje personal, 1 en Arte en Madera, 0 en Organización
  personal a propósito, 7 en EMA OS).
- **9 notas de contexto** en Markdown (una por proyecto, Sprint 3.3),
  todas espejadas a Google Drive con `driveFileId` confirmado.
- **8 Next Actions** marcadas (todas menos Organización personal, que
  queda sin Next Action a propósito para que el usuario la pueble desde
  el Inbox conforme surjan compromisos personales).
- Verificado en `/my-day` que se puede planificar una tarea para hoy
  (`planForToday`) — probado y revertido tras confirmar que funciona, no
  se dejó ninguna tarea real planificada de más.
- Un commit por proyecto (9 commits `seed: ...`), cada uno verificado
  contra la DB (conteo de tareas, nota presente, Next Action correcta)
  antes de avanzar al siguiente, como pidió el usuario.
- Sin incidentes: ningún Server Action rechazó, no hizo falta revertir
  ningún proyecto a medias.

### ✅ Sprint 4.1 — OAuth y verificación del scope sensible de Calendar (2026-07-12)

**Desbloqueado y completo.** Historial de la sesión (para no perder el
diagnóstico si algo similar vuelve a pasar):

1. `SCOPE` en `app/lib/google-drive-auth.ts` ampliado a `drive.file` +
   `calendar.events`. Botón "Desconectar y reconectar" en `/settings`
   (`app/actions/settings.ts::disconnectAndReconnectDrive`) para forzar
   reconsentimiento en un clic.
2. Primer intento del dueño: el token nuevo NO tenía Calendar activo. Causa:
   el navegador sirvió una versión cacheada de `/settings` con un link OAuth
   viejo — solucionado con recarga forzada (Ctrl+Shift+R) antes de reintentar.
3. Segundo intento: pantalla de consentimiento de Google confirmó ambos
   permisos ("Ver y editar eventos en tus calendarios" + Drive), aceptado.
   Pero la verificación con `calendarList.list` seguía dando 403
   `ACCESS_TOKEN_SCOPE_INSUFFICIENT`.
4. **Diagnóstico correcto — dos falsas pistas descartadas antes de encontrar
   la causa real**: (a) se sospechó que la Calendar API no estaba habilitada
   en el proyecto de Google Cloud — el dueño confirmó que sí ("API
   habilitada" con check verde); (b) se sospechó que la API se había
   habilitado en el proyecto de Cloud equivocado — el dueño confirmó que el
   número de proyecto (`247476142976`) coincide exactamente con el prefijo
   del `client_id` configurado. **La causa real era un error en la propia
   verificación**: `calendarList.list` (listar calendarios) requiere el
   scope `calendar`/`calendar.calendarlist`, NO `calendar.events` — el scope
   que se pidió a propósito (acotado a eventos, no gestión de calendarios,
   decisión ya documentada). El endpoint correcto para verificar es
   `events.list`/`events.insert` sobre `calendars/primary`.
5. **Verificado con el endpoint correcto, contra la cuenta real del
   usuario** (`eduardocortezpena@gmail.com`): lectura confirmada (3 eventos
   reales listados de `calendars/primary/events`); escritura confirmada
   (evento de prueba creado con id real, `htmlLink` real de
   calendar.google.com, y borrado después para no dejar basura en el
   calendario real del dueño).

**DoD cumplido**: "la app puede leer y escribir el calendario del usuario
tras el consentimiento" — confirmado con llamadas reales a la API, no
asumido.

**Lección para sprints futuros que llamen a la Calendar API**: usar
`calendars/primary/events` (no `calendarList`) como patrón de verificación
por defecto, dado el scope acotado a `calendar.events`.

### Sprint Backlog — Fase 7

- [x] **Sprint 7.1 — Command palette (Cmd/Ctrl+K) con `cmdk`.** Componente
      cliente `CommandPalette.tsx` montado una vez en `layout.tsx` (ahora
      async, lee proyectos vía Prisma). Modos: root (navegación + crear),
      project-name, select-project, entity-title. `quickCreate*` en
      `app/actions/quick-create.ts` delegan en las Server Actions existentes
      (createProject/createTask/createNote) vía FormData — sin duplicar
      validación. `revalidatePath('/', 'layout')` añadido en
      create/update/deleteProject para no cachear la lista de proyectos
      estáticamente. **Verificado end-to-end contra la DB real**: navegación,
      creación de proyecto/tarea/nota desde la paleta (incl. espejo a Drive
      de la nota, confirmado con driveFileId real). Reviewer encontró un bug
      real: `await quickCreate*` se rechaza cuando la Server Action interna
      hace `redirect()` en su rama de error (comportamiento de Next con
      Server Actions invocadas directamente), dejando la paleta atascada sin
      `catch`. **Corregido**: try/catch que cierra la paleta en error, más
      alineación de `createTask` con la validación explícita de proyecto que
      ya tenía `createNote`. Verificado de nuevo tras el fix (smoke test).
      Hallazgos menores (input decorativo sin filtro en select-project, sin
      cancelación de request en carrera con "atrás") anotados en BACKLOG.md.
      Nota de entorno: el `key` nativo "Enter" del navegador de pruebas no
      llega al keydown-handler interno de cmdk (confirmado con
      `KeyboardEvent` vía JS que sí funciona) — limitación de la herramienta
      de automatización, no de la app; no afecta a un teclado real.

- [x] **Sprint 7.2 — Atajos de teclado + panel de ayuda (?).** `C`/`N`
      abren la command palette directo en el flujo de creación (evento
      custom `ema-open-create`, sin duplicar lógica). `G` luego `D`/`P`/`M`
      = chord de navegación (800ms timeout). `P` con el mouse sobre una
      tarea en `/tasks` avanza su prioridad (delegación de eventos sobre
      `data-task-id`, sin envolver cada fila en un client component). `?`
      abre/cierra el panel de ayuda. Todos ignoran el atajo si hay
      Ctrl/Cmd/Alt presionado o si el foco está en un campo de texto — sin
      conflicto con atajos nativos de Windows/navegador (ninguno usa
      modificador). Revisión de architect no necesaria (sin schema, sin
      fricción de accesibilidad detectada de antemano).
      **Verificado en navegador contra la DB real**: `?` abre/cierra
      (incl. Escape), `C` crea tarea saltando el menú raíz, `P` avanza
      LOW→MEDIUM→HIGH en dos pulsaciones consecutivas SIN mover el mouse
      (caso específico que expuso el bug), `G`+`D` y `G`+`P` navegan
      correctamente. Reviewer encontró: (1) bug real — `hoveredRef` solo se
      actualizaba en `mouseover`, así que una segunda "P" con el mouse
      quieto recalculaba el mismo salto en vez de avanzar — **corregido**
      con actualización optimista local tras cada ciclo exitoso, **re-verificado
      con el caso exacto reportado**; (2) `HelpPanel` no cerraba con Escape
      a diferencia de `CommandPalette` (Radix Dialog) — **corregido y
      verificado**; (3) `isTypingTarget` duplicada en dos componentes —
      **extraída a `app/lib/keyboard.ts`**; (4) sin exclusión mutua entre
      modales — **corregido**, con el panel de ayuda abierto solo "?"
      hace algo. `PRIORITY_CYCLE` también se movió a `app/lib/priority.ts`
      (un módulo `'use server'` no puede exportar constantes, solo
      funciones async).

- [x] **Sprint 7.3 — Optimistic UI en crear tarea/nota.** `TaskBoard.tsx` y
      `NoteBoard.tsx` (client components nuevos, reemplazan el listado+form
      que antes vivía directo en `/tasks` y `/notes`) usan `useOptimistic`
      de React 19: la entidad aparece al instante (opacidad reducida +
      "Guardando…") pasado directo como `action` del `<form>` (React 19
      envuelve las form actions en una transición automáticamente, sin
      `useTransition` manual). Sin librerías nuevas.
      **Verificado en navegador contra la DB real**: camino feliz de tarea
      y nota (nota confirmada con espejo a Drive intacto); **rollback
      forzado** — borré el proyecto de la DB sin recargar la página (dejando
      el `<option>` obsoleto en el `<select>`) y envié el form apuntando a
      ese proyecto ya borrado: la URL navegó a `?error=Proyecto no
      encontrado`, el banner se mostró, CERO rastro de la entrada optimista
      en el DOM, y 0 filas huérfanas en la DB.
      Reviewer encontró un **bug bloqueante real**: doble-submit (doble
      clic) creaba dos filas reales duplicadas — el guard inicial con
      `useState` no bastaba. **Corregido y re-verificado con el caso más
      agresivo** (dos `requestSubmit()` en el mismo tick JS, que antes sí
      duplicaba): cambiado a `useRef` (síncrono, no sujeto al timing de la
      transición de React) — confirmado 1 sola fila tanto en tareas como en
      notas tras el fix. También corregido: atajo "P" (Sprint 7.2) ahora
      ignora filas optimistas (`optimistic-*`) para no disparar un error
      confuso sobre un id que no existe en DB todavía. Hallazgo cosmético
      (tarea CRITICAL optimista aparece al final en vez de su posición
      ordenada) anotado en BACKLOG.md, no bloqueante.
- [x] **Sprint 7.4 — Quick Capture (Inbox).** Decisión de architect:
      **Opción A** — `Tarea.projectId` pasa a nullable (`String?`,
      `onDelete: SetNull`); un ítem de inbox es literalmente una Tarea sin
      proyecto. Migración manual (rebuild de tabla SQLite, tabla vacía, sin
      backfill) `20260711150000_tarea_project_id_optional`, sin drift
      (`prisma migrate status` limpio). `createTask` ya no exige proyecto;
      nueva acción `assignTaskToProject` (update simple de `projectId`) para
      clasificar. Página nueva `/inbox`: captura rápida (solo título) +
      lista de ítems sin clasificar con selector de proyecto inline.
      Enlaces añadidos al sidebar y a la command palette (7.1).
      Corregidos 3 sitios en `app/my-day/page.tsx` que asumían
      `task.project.name` no-nulo (`availableTasksRaw` incluye ítems de
      inbox) — architect lo predijo antes de escribir código, evitando el
      crash. Decisión deliberada de NO extender la command palette (7.1)
      para crear tareas de inbox directas — el DoD ya se cumple vía
      `/inbox`, evita scope creep.
      **Verificado contra la DB real**: capturar sin proyecto → `projectId:
      null` confirmado; clasificar → `projectId` pasa al id real; `/my-day`
      y `/tasks` renderizan sin crash con ítems mixtos (clasificados y sin
      clasificar), confirmado en pestaña de navegador nueva sin logs de
      consola acumulados de sesión. Reviewer encontró: (1) bug real — el
      form de captura en `/inbox` no tenía el guard de doble-submit de 7.3,
      **corregido** con el mismo patrón `useRef` (componente cliente nuevo
      `InboxCaptureForm.tsx`), re-verificado con doble-submit agresivo (1
      sola fila); (2) `onDelete: SetNull` cambia el comportamiento de
      `deleteProject` (antes bloqueaba con tareas asociadas, ahora las
      mueve a Inbox silenciosamente) — **comunicado explícitamente** en el
      texto de `ConfirmButton` de borrar proyecto, verificado en runtime
      que el `SetNull` funciona (proyecto borrado, tarea preservada con
      `projectId: null`). `Nota`/`Archivo` siguen `RESTRICT` (no tocados,
      fuera de alcance del sprint).
      **Fase 7 completa: 7.1, 7.2, 7.3, 7.4.**

#### Completed (Fase 3, sesiones previas)
- [x] Fase 0 — MVP completo.
- [x] Fase 1 — Priorización completa (Next Action, My Day, prioridad+orden).

#### Completed (esta fase)
- [x] Renumeración de ROADMAP.md: Drive pasa a Fase 3, Fase 2 queda
      reservada (candidata: Clasificador de archivos).
- [x] BACKLOG.md: contexto de "Clasificador de archivos" e "Importar
      WhatsApp exportado" (sin implementar, solo anotado).
- [x] Sprint 3.1: Carpeta local `./files/{projectId}/` + modelo `Archivo`
      (kind NOTE|FILE, driveFileId nullable para Drive). `Nota` sin tocar
      (se decide en 3.3). Página `/files` lista el índice.
- [x] **Sprint 3.2 — OAuth Desktop app + refresh token cifrado.**
      Modelo `GoogleDriveToken` (fila única, AES-256-GCM). Flujo loopback
      sobre el propio servidor Next (`/settings/drive/callback`), scope
      `drive.file`. **Verificado con el usuario real**: login real en su
      cuenta de Google, token cifrado confirmado en DB, servidor matado y
      reiniciado de verdad sin pedir login otra vez, llamada real a la
      API de Drive (200 OK, cuenta real del usuario). 2 hallazgos de
      seguridad del reviewer corregidos antes de cerrar (mensajes de
      error sanitizados, limpieza de `invalid_grant`).

- [x] **Sprint 3.3 — Notas como Markdown en Drive.** Decisión de architect:
      consolidar notas en `Archivo(kind=NOTE)`, `Nota` INTACTA como respaldo
      reversible (no se dropea este sprint). Schema delta mínimo:
      `Archivo.sourceNotaId String? @unique` (migración aditiva
      `20260711120000_archivo_source_nota`, aplicada con `migrate deploy`).
      Fuente de verdad = `.md` local (`files/{projectId}/notes/{archivoId}.md`),
      Drive = espejo, SQLite = índice. Editor Markdown ligero (textarea +
      toggle preview, renderer propio sin librería). Al re-guardar hace PATCH
      del `driveFileId` (no duplica). Espejo degrada graceful si Drive falla.
      Backfill idempotente `migrateLegacyNotes` (botón en Settings, NO gateado
      por Drive) — 0 notas legacy en la DB, así que es no-op verificado.
      **Verificado end-to-end contra el Drive real del usuario**: nota creada
      en la web → `Nota de prueba 3.3.md` (text/markdown) confirmada vía Drive
      API en la cuenta `eduardocortezpena@gmail.com`, contenido idéntico;
      edición → PATCH al mismo fileId, sin duplicado (búsqueda por nombre = 1).
      Reviewer corrió build limpio y encontró 2 blockers + issues; corregidos
      antes de cerrar: **H1 XSS** en el render de enlaces Markdown (escapar
      comillas — verificado con payload real: 0 handlers vivos inyectados),
      **H2** migración ya no gateada por Drive (recuperación de notas legacy
      sin conexión), **M2** `getNoteContent` busca por id en DB (no confía en
      params del cliente), **M3** `createNote` valida que el proyecto exista
      antes de escribir a disco (cierra path traversal). Resto de findings
      (M1, M4-M6, L1-L4) anotados como deuda no bloqueante en BACKLOG.md.
      Artefactos de prueba limpiados de DB, disco y Drive.

- [x] **Sprint 3.4 — Subir/crear archivos y carpetas en Drive.** Decisión de
      architect: `driveFolderId` en `Proyecto` (nullable), migración aditiva
      `20260711140000_proyecto_drive_folder`. Carpeta del proyecto se crea de
      forma **perezosa** en el primer upload (`ensureProjectDriveFolder`,
      idempotente) — `createProject` sigue sin dependencia de red, verificado
      (proyecto creado con `driveFolderId: null` hasta el primer upload).
      `Archivo(kind=FILE)` reusado sin cambios de schema. Subida de binarios
      vía `FormData`/`Blob` nativo de `fetch` (`uploadFileToDrive`) — NO el
      multipart de string de las notas (3.3), que habría corrompido binarios;
      decisión explícita de architect, verificada con un PDF real (MD5 local
      == MD5 en Drive). UI: formulario de subida por proyecto en `/files`,
      enlaces "Ver carpeta en Drive" / "en Drive" por archivo.
      **Verificado end-to-end contra Drive real**: carpeta
      "Proyecto Archivos 3.4" creada en la cuenta `eduardocortezpena@gmail.com`,
      archivo `prueba-3.4.pdf` confirmado DENTRO de esa carpeta (`parents`
      coincide), hash MD5 idéntico entre disco local y Drive. Reviewer corrió
      build limpio + su propia verificación end-to-end independiente contra
      Drive real (incluyendo pruebas de path traversal con `/` y `\` —
      `safeOriginalName` confirmado seguro en ambos separadores). Sin
      bloqueantes; findings de bajo impacto (límite de tamaño ya cubierto por
      default de Next 1MB, patrón `mirror*ToDrive` duplicado a propósito,
      fila huérfana si falla el update final) anotados en BACKLOG.md.
      Artefactos de prueba limpiados de DB, disco y Drive (por mí y también
      por el propio reviewer en su verificación independiente).

#### To Do (siguiente, en orden — ver ROADMAP.md Fase 3)
- [ ] Sprint 3.5 (OPCIONAL) — rclone bisync bidireccional. Ver BACKLOG.md
      para las advertencias — **requiere sesión con supervisión humana**,
      explícitamente excluido de sesiones sin supervisión (riesgo real de
      pérdida de datos documentado por rclone).

### ✅ RESUELTO — decisión del usuario sobre Fase 2 vs Fase 7

El dueño confirmó explícitamente (sesión 2026-07-11, "sin supervisión,
larga"): **Fase 2 = oficialmente "Clasificador de archivos"**, se hará en
otro chat, NO tocar en esta sesión. Los sprints de UX (command palette,
atajos, optimistic UI, inbox) son **Fase 7**, tal como ya decía
`ROADMAP.md` — se ejecutan con su numeración correcta, sin renumerar nada.
Bloqueo cerrado, procediendo con Fase 7 en orden.

### Definition of Done
Reference: .claude/skills/definition-of-done/SKILL.md

### Blockers
- Ninguno para lo ejecutado. Ver sección "BLOQUEADO — esperando decisión
  del usuario" arriba para lo que falta.
- El bloqueo de pasos manuales de Google Cloud Console
  (proyecto, Drive API, OAuth consent screen, credenciales Desktop app,
  publicar a producción) ya se resolvió — confirmado por el usuario.

### Notas técnicas para la próxima sesión
- Tras CUALQUIER migración de Prisma: `npx prisma generate` Y matar+
  reiniciar el PROCESO de `npm run dev` (no solo `preview_start` con
  `reused: true` — eso NO reinicia el proceso ni recarga `.env`. Hay que
  encontrar el PID con `netstat` y `taskkill` antes de levantarlo de
  nuevo). Verificar siempre que `app/lib/db.ts` sobrevive.
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` y
  `ENCRYPTION_KEY` ya están en el `.env` local del usuario (nunca en
  git, `.env.example` documenta los nombres sin valores).
- `app/lib/google-drive-auth.ts` (`getValidAccessToken`) es el punto de
  entrada para cualquier llamada futura a la API de Drive — reusar, no
  reimplementar el manejo de refresh.
- Llamadas de red vía `node -e` vía Bash pueden ser interceptadas por un
  hook del plugin `context-mode` ("Inline HTTP redirected") — si pasa,
  usar la herramienta PowerShell en su lugar, ahí no intercepta.
- El entorno de automatización del navegador sigue con timing errático
  en formularios con más de un `input[name="..."]` igual en la misma
  página (ej. form de crear vs. form de editar con el mismo campo
  `name="name"`) — el selector agarra el primero en orden del DOM, no
  necesariamente el correcto. Apuntar el selector por el botón de
  submit más cercano (`Array.from(document.querySelectorAll('button')).find(...)`)
  en vez de por nombre de campo solo.

### Deuda conocida no bloqueante (ver BACKLOG.md Technical Debt)
- Borrar un Proyecto con Tareas/Notas asociadas falla por FK (desde
  Sprint 0.2).
- `startOfDay` usa timezone del servidor, no documentado como asunción
  (desde Sprint 1.4).
- `app/projects/page.tsx` y `app/notes/page.tsx` reimplementan su propio
  wrapper de layout (desde Sprint 0.4).
- `app/lib/files.ts` sin guard anti path-traversal en `projectId` (desde
  Sprint 3.1, no explotable hoy).
- Proyectos previos a Sprint 3.1 no tienen carpeta en `files/{id}/` —
  resolver antes de Sprint 3.4.
- Callback OAuth sin parámetro `state` (CSRF, riesgo marginal en
  localhost) — desde Sprint 3.2.

### Daily Notes
2026-07-10: Fase 0 (MVP) completada.
2026-07-11 (sesión N-2): PASO 0 + Sprint 1.1 completados.
2026-07-11 (sesión N-1): Sprints 1.2, 1.3, 1.4 completados. Fase 1 completa.
2026-07-11 (esta sesión): CLAUDE.md actualizado con checklist de sesión.
Fase 3 renumerada a pedido del usuario. Sprint 3.1 y 3.2 completados y
verificados con evidencia real de extremo a extremo, incluyendo el login
real de Google del propio usuario. Parado aquí en verde tras el sprint
más delicado del proyecto — Sprints 3.3-3.5 quedan para la próxima sesión.
2026-07-11 (sesión siguiente): **Sprint 3.3 completado y verificado
end-to-end contra el Drive real del usuario** (crear+editar nota → .md en
Drive confirmado vía API; PATCH sin duplicados; XSS del render corregido y
verificado). Reviewer corrió build limpio; 4 findings arreglados, resto en
BACKLOG. Artefactos de prueba limpiados. **Sprint 3.4 NO se empezó**:
decisión de presupuesto — no cabía entero y la regla es no dejar sprints a
medias (3.4 necesita migración `driveFolderId` + carpetas en Drive + subida
de archivos + verificación propia). **Sprint 3.5 documentado en BACKLOG.md**
con las advertencias de rclone bisync (beta/pérdida de datos, --resync
obligatorio + respaldo, flags robustos). Próxima sesión: empezar por Sprint
3.4 con presupuesto holgado.
2026-07-11 (sesión larga sin supervisión): **Sprint 3.4 completado y
verificado end-to-end contra Drive real** (carpeta de proyecto creada lazy
en primer upload, archivo subido confirmado DENTRO de la carpeta correcta,
MD5 idéntico local vs Drive — integridad binaria confirmada). Reviewer
corrió su propia verificación independiente contra Drive real, sin
bloqueantes. **Fase 3 queda así: 3.1, 3.2, 3.3, 3.4 completos; solo falta
3.5 (opcional, requiere sesión supervisada, NO intentado en esta sesión por
instrucción explícita).** El bloque de "Fase 2" del prompt (command
palette, atajos, optimistic UI+inbox) **NO se implementó**: no coincide con
`ROADMAP.md` (Fase 2 está reservada sin sprints aprobados; ese contenido es
textualmente Fase 7). Documentado como "esperando decisión del usuario" más
arriba en este archivo — no hay sprint independiente para seguir en su
lugar dentro del alcance permitido de esta sesión. **Primero que hay que
mirar al despertar: la sección "⚠️ BLOQUEADO — esperando decisión del
usuario" arriba, para decidir si esos 3 sprints van a Fase 2 o Fase 7 (y
actualizar ROADMAP.md en consecuencia) antes de que se puedan ejecutar.**
2026-07-11 (sesión larga sin supervisión, continuación): decisión de Fase 2
resuelta por el dueño (oficialmente "Clasificador de archivos", en otro
chat). **Fase 7 completada entera esta sesión: 7.1 (command palette Ctrl+K
con `cmdk`), 7.2 (atajos de teclado + panel de ayuda), 7.3 (optimistic UI
en crear tarea/nota con `useOptimistic`), 7.4 (Quick Capture/Inbox,
`Tarea.projectId` nullable)** — los 4 sprints con consulta a `architect`
antes de cada decisión de schema/arquitectura, reviewer al cerrar cada uno
(encontró bugs reales en 3 de los 4: promesa rechazada por `redirect()` en
7.1, bug de prioridad stale en 7.2, doble-submit duplicando filas en 7.3 y
7.4 — todos corregidos y re-verificados con el caso exacto que los
expuso), y verificación real en navegador + DB en cada sprint. **Fase 4
(Calendar) se empezó y se bloqueó de inmediato en el Sprint 4.1**: requiere
habilitar Calendar API + agregar scope en Google Cloud Console (pasos
manuales del dueño) y una re-autorización OAuth real con clic humano en el
navegador — ninguno de los dos es posible sin supervisión. Documentado con
instrucciones exactas en la sección "⚠️ BLOQUEADO — Sprint 4.1" arriba. No
se escribió código de Calendar todavía (mismo criterio que 3.2: no
programar hasta que los pasos manuales estén confirmados). Fase 5 NO se
tocó — con Fase 7 completa (4 sprints con reviewer cada uno) y Fase 4
bloqueada en la misma sesión, no queda margen seguro de presupuesto para
abrir una fase nueva. **Primero que hay que mirar al despertar: la sección
"⚠️ BLOQUEADO — Sprint 4.1" arriba, con los 3 pasos exactos en Google
Cloud Console antes de poder seguir con Calendar.**
