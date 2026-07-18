<!-- ROTACIÓN 2026-07-18 — copia ciega del BACKLOG.md activo antes del recorte -->

# BACKLOG.md
## Feature Backlog

### High Priority
- [x] Connect Projects CRUD to Prisma Server Actions (Sprint 0.2)
- [x] Connect Tasks CRUD to Prisma Server Actions (Sprint 0.3)
- [x] Connect Notes CRUD to Prisma Server Actions (Sprint 0.4)
- [x] Add form validation (required fields, type checking) — hecho por CRUD conectado
- [x] Implement delete confirmation dialogs — ConfirmButton en Proyectos/Tareas/Notas
- [x] Dashboard real statistics from database (Sprint 0.5, completado)
- [ ] Sprint 1.5 (ROADMAP Fase 1, OPCIONAL): orden sugerido automático en /tasks y /my-day — score simple combinando prioridad + cercanía de deadline + antigüedad (createdAt). Reusar/extender `app/lib/sort.ts` (ya tiene `byPriorityAndDueDate`, solo priority+dueDate, falta el componente de antigüedad). Pospuesto por presupuesto de tokens al cerrar Fase 1 (2026-07-11).

### Medium Priority
- [x] **Riesgo de prompt injection vía mensajes `role: 'user'` en el chat del asistente** (`app/api/chat/route.ts`, Sprint 6.2, reviewer). **Resuelto en Sprint 6.4**: las tools de escritura (`crear_tarea`, `crear_nota`, `completar_tarea`, `mover_archivo_a_proyecto`) NUNCA ejecutan directo desde el loop de tool_use — el servidor pausa, genera un `confirmationId` propio, y solo ejecuta tras un clic REAL en un botón de la UI (`app/assistant/page.tsx`), nunca por interpretación de texto del modelo. Aunque el modelo sea manipulado por una inyección para "decidir" llamar a una tool de escritura, la propuesta queda parada esperando confirmación humana — reviewer confirmó en código que `executeWriteTool` tiene un único call-site, dentro del branch de confirmación, sin caminos alternativos. Sigue habiendo un riesgo teórico de que una inyección le muestre al usuario una propuesta engañosa (ingeniería social vía UI), pero eso ya no es "ejecución sin confirmación" — es un riesgo distinto, de menor severidad, no cubierto explícitamente todavía.
- [ ] **`PENDING_CONFIRMATIONS` en memoria (`app/api/chat/route.ts`, Sprint 6.4, reviewer) — asunción de proceso único no documentada en `ARCHITECTURE.md`.** El `Map` de confirmaciones pendientes vive en memoria del proceso Node; funciona correctamente en un despliegue self-hosted de proceso único (el caso actual de EMA OS), pero un restart de proceso (crash, redeploy, HMR en dev — ya observado en esta sesión) vacía el mapa y el usuario ve "confirmación expirada" de forma espuria. No es un fallo de seguridad (nunca se ejecuta sin confirmar), solo de disponibilidad/UX. Si en el futuro EMA OS se despliega en un entorno serverless/multi-instancia, esto se rompe de verdad (la confirmación podría caer en otra instancia). Documentar la asunción explícitamente en `ARCHITECTURE.md` cuando se toque ese archivo.
- [ ] **`crearTarea` puede invocar `createTask` con `titulo` vacío fuera de su contrato original** (`app/lib/assistant-tools.ts`, Sprint 6.4, reviewer — parcialmente mitigado). Se agregó una validación de `titulo` no vacío antes de construir el `FormData` (fix aplicado en el mismo sprint), pero `createTask`/`crearNota` siguen invocándose como funciones de biblioteca fuera del contexto real de formulario/Server Action para el que `redirect()` fue diseñado — si algún otro campo dispara ese `redirect()` interno de validación, `executeWriteTool` lo enmascara como "Error interno" genérico en vez de un mensaje específico. No bloqueante, pero vale revisar si conviene una validación más completa espejando la de cada Server Action antes de construir el `FormData`, en vez de confiar en que el `catch` genérico absorbe cualquier fallo.
- [ ] **Fase 11 — Sistema de inventario: nueva pestaña en EMA OS + perfil agéntico "Inventarista"** (anotado 2026-07-14, sesión de auditoría de memoria; actualizado 2026-07-17). El dueño hará/hizo el primer inventario MANUAL en su viaje a Xalma (activo de terrenos/lotes del proyecto inmobiliario). Quiere que en la próxima quincena exista un cotejo AUTOMATIZADO — comparar el inventario real contra lo registrado en EMA OS y señalar discrepancias. Requiere: (1) una vista/pestaña nueva en la app para capturar y ver el inventario — **columnas sugeridas: artículo, cantidad, ubicación, estado, foto** (schema todavía sin definir en firme, consultar `architect` antes de tocar Prisma), (2) un agente "Inventarista" (mismo patrón que Organizador/Comunicador/Seguridad ya diseñados en `AGENTES.md`) que compare el inventario manual contra el estado registrado. NO implementado, sin diseño de schema todavía — anotado para sesión dedicada, probablemente después de que el dueño complete/entregue el inventario manual (necesita saber qué campos captura a mano antes de diseñar la tabla en firme).


- [ ] **[Seguridad — prerrequisito antes de cualquier despliegue remoto]** La app no tiene autenticación ni control de sesión (hallazgo "Alta" de auditoría 2026-07-18). Es mono-usuario local por diseño; aceptable en ese contexto. Si algún día se expone vía Tailscale o nube, implementar autenticación (NextAuth/similar) ANTES de cualquier otra funcionalidad de ese despliegue.
- [ ] Search and filter functionality for each module
- [ ] Project progress calculation based on tasks
- [ ] Bulk actions (delete multiple items)
- [ ] Export data to JSON/CSV
- [ ] Asociar una nota a una tarea específica dentro del proyecto (Nota.taskId ya existe y es opcional desde Sprint 0.1, pero la UI no lo expone todavía — fuera de alcance de Fase 0)
- [ ] **Clasificador de archivos**: analizar ~5 carpetas ACOTADAS del disco del usuario y PROPONER a qué proyecto pertenece cada archivo (PDFs, Word, hojas de cálculo, imágenes). Aprobación manual antes de mover — nunca borrar, solo copiar/enlazar. La carpeta resultante ordenada sería la carpeta madre que se sincroniza con Drive en la Fase 3 (`./files/{proyecto}/`). Candidata a Fase 2 (reservada, sin sprints todavía) del ROADMAP.md. Anotado 2026-07-11, sin implementar.
- [ ] **Importar chat de WhatsApp exportado**: ingerir un `.txt` exportado manualmente desde WhatsApp (Chat > Exportar chat > Sin multimedia/Con multimedia) y asociarlo a un proyecto como nota o archivo indexado. NO usar APIs no oficiales ni scraping de WhatsApp — viola sus términos de servicio y arriesga el baneo del número del usuario (ya reflejado en ROADMAP.md, sección "Qué NO hacer"). Solo archivos exportados manualmente por el usuario. Sin fase asignada todavía. Anotado 2026-07-11, sin implementar.

### Fase 3 — pendiente
- [ ] **Sprint 3.5 (OPCIONAL) — rclone bisync: espejo bidireccional local ↔ Drive.**
  Sincronización bidireccional real entre `./files/{projectId}/` y la carpeta
  del proyecto en Drive usando `rclone bisync`, de modo que un cambio hecho en
  el disco o en Drive se refleje en el otro lado.

  **⚠️ ADVERTENCIA OFICIAL DE RCLONE — LEER ANTES DE EMPEZAR:** `rclone bisync`
  está marcado como **beta** en su propia documentación, que dice textualmente
  que **puede resultar en pérdida de datos** ("this command can potentially
  result in data loss"). No es una funcionalidad estable. Tratarla como
  experimental y de alto riesgo: es la razón por la que este sprint es OPCIONAL
  y va al final de la Fase 3.

  **Reglas duras de ejecución (no negociables):**
  - **Primera corrida OBLIGATORIA con `--resync`** para establecer la línea base
    (sin esto, bisync no sabe el estado previo y puede borrar en masa). La
    corrida inicial `--resync` debe ir precedida de un **respaldo completo** de
    `./files/` y, si es viable, de la carpeta de Drive (exportar/copia), para
    poder revertir si algo sale mal.
  - **Flags robustos recomendados** (mitigan fallos parciales y conflictos):
    `--resilient --recover --conflict-resolve newer --drive-skip-gdocs`.
    (`--resilient`/`--recover`: recuperación tras interrupción; `--conflict-resolve
    newer`: ante conflicto gana el más reciente; `--drive-skip-gdocs`: ignora
    Google Docs nativos que no tienen contenido descargable real.)
  - **No arrancar sin sesión fresca y presupuesto de tokens holgado.** Es un
    sprint delicado; empezarlo con presupuesto ajustado y dejarlo a medias
    puede corromper la sincronización. Igual que el criterio con el que se
    pospuso aquí: un sprint terminado vale más que dos a medias.

  Precondición: depende del Sprint 3.4 (carpeta del proyecto en Drive +
  `driveFolderId`), que a su vez no estaba implementado al anotar esto
  (2026-07-11).

### Low Priority
- [ ] Keyboard shortcuts
- [ ] Mobile-optimized sidebar (drawer)
- [ ] Drag-and-drop task reordering
- [ ] Tags/categories for projects
- [ ] **Layout móvil roto en algunas páginas por el reescalado de pantalla** (Sesión con supervisión parcial, Parte 3, 2026-07-13). Confirmado por el dueño probando en su Poco F7 Pro real vía LAN: el dashboard carga y es usable, pero "algunas páginas no están bien adaptadas por el reescalado de la pantalla". El dueño no especificó cuáles páginas exactamente — pendiente de detalle (screenshots o lista concreta) en una sesión futura antes de poder diagnosticar/arreglar. Candidato natural para Fase 10 (Estilización y pulido visual, ROADMAP.md) — NO se arregla ahora, fuera de alcance de esta sesión (prioridad: funcionalidad y comodidad, diseño visual pospuesto explícitamente).

### Technical Debt
- [ ] Add integration tests
- [ ] Set up CI/CD pipeline
- [ ] Add ESLint custom rules
- [ ] Document component API
- [ ] Performance monitoring setup
- [ ] `app/projects/page.tsx` y `app/notes/page.tsx` reimplementan su propio wrapper (`min-h-screen bg-gray-950` + `container mx-auto p-4`) en vez de usar solo el `<main>` de `app/layout.tsx` — viola ui-guidelines ("las páginas hijas no deben reimplementar su propio wrapper de layout"). Hallazgo del reviewer en Sprint 0.4, no bloqueante, pendiente de limpieza (candidato: Sprint 1.5 o 7.2).
- [x] `app/dashboard/page.tsx` tema claro — corregido en Sprint 0.5.
- [ ] `app/lib/files.ts` (`projectFilesDir`/`ensureProjectFilesDir`) no valida el formato de `projectId` antes de `path.join` — seguro hoy porque el único caller pasa un `cuid()` de Prisma, pero si un sprint futuro lo invoca con un id de formulario/URL falta un guard (regex de cuid) contra path traversal. Detectado en Sprint 3.1.
- [x] Proyectos creados ANTES de Sprint 3.1 sin carpeta en `files/{id}/` — resuelto de facto en Sprint 3.3/3.4: `writeNoteMd`/`writeUploadedFile` hacen `fs.mkdirSync(dir, { recursive: true })` en cada escritura, no dependen de que `ensureProjectFilesDir` haya corrido antes en `createProject`. No hace falta backfill.
- [ ] Borrar un Proyecto con Tareas/Notas asociadas falla por restricción de FK (mensaje genérico, hay que borrar hijos primero manualmente). Considerar `onDelete: Cascade` en el schema o un mensaje explícito guiando al usuario. Detectado en Sprint 1.1, preexistente desde Sprint 0.2.
- [ ] `app/settings/drive/callback/route.ts` no usa parámetro `state` en el flujo OAuth (protección estándar contra login-CSRF, RFC 6749). Impacto marginal hoy porque es un servidor loopback de un solo usuario sin exposición a internet, pero si esto deja de ser puramente local hay que agregarlo. Detectado en Sprint 3.2 (revisión de seguridad, sprint más delicado del proyecto).
- [ ] `startOfDay` (`app/lib/date.ts`, usado por "My Day") usa la zona horaria del servidor (Node), no la del usuario — asunción no documentada, aceptable para un solo usuario/zona en el MVP pero riesgo si se despliega en un servidor con TZ distinta. Detectado en Sprint 1.4.
- [ ] **`Tarea.dueDate` puede desfasarse un día cerca de bordes de mes/zona horaria** (`app/actions/task-actions.ts`, Sprint 4.2, hallazgo del reviewer en Sesión con supervisión parcial Parte 2). `dueDateStr` (string `YYYY-MM-DD` de un `<input type="date">`) se parsea con `new Date(dueDateStr)`, que interpreta fechas ISO de solo-fecha como **medianoche UTC**, mientras que `app/calendar/page.tsx` (nueva vista) construye `monthStart`/`nextMonthStart` con `new Date(year, month-1, 1)` en hora **local** del proceso Node. En una zona con offset negativo (ej. México, UTC-6), esto puede mostrar una tarea del día 1 en el mes anterior o el último día en el mes siguiente. No verificado como problema real hoy (los datos de prueba con Xalma coincidieron correctamente), pero es una fuente de desfase silencioso. Arreglo propuesto: normalizar todo el manejo de "fecha sin hora" a un único criterio (ej. guardar y comparar siempre en UTC, o parsear `dueDateStr` con componentes locales explícitos `new Date(y, m-1, d)` en vez de `new Date(string)`). Afecta a cualquier código que lea/escriba `dueDate`, no solo `/calendar`.
- [ ] **Subida de archivos sin límite de tamaño explícito** (`app/actions/files.ts`, Sprint 3.4, reviewer). Next 16 aplica un límite de 1MB por defecto a nivel de Server Action (`serverActions.bodySizeLimit`), así que hoy no hay riesgo real, pero si se decide soportar archivos más grandes hay que configurar ese límite explícitamente y decidir el mensaje de error — hoy un archivo >1MB probablemente cae en una página de error genérica de Next en vez de `/files?error=...`.
- [ ] **Patrón `mirror*ToDrive` duplicado entre `app/actions/notes.ts` y `app/actions/files.ts`** (Sprint 3.4, reviewer). Mismo patrón deliberadamente replicado (crear fila con `path:''` → escribir local → espejar a Drive con try/catch que traga error → update final con path/driveFileId). No bloqueante hoy; si aparece un tercer caso (ej. futuro clasificador de archivos) vale la pena extraer un helper común.
- [ ] **Fila `Archivo` huérfana si el `update` final falla** tras escribir a disco (`app/actions/files.ts` y `app/actions/notes.ts`, Sprint 3.3/3.4, reviewer). Dejaría un `Archivo(path:'')` visible en `/files`/`/notes`. Riesgo bajo, mismo patrón aceptado desde 3.3.

- [ ] **Nota: pérdida silenciosa de contenido si el .md local falta Y Drive falla** (`getNoteContent`, `app/actions/notes.ts`, Sprint 3.3, reviewer M1). Si el `.md` local no existe y la descarga de Drive lanza, devuelve `''`; si el usuario guarda entonces, sobrescribe la nota con vacío. Hoy no explotable en la máquina del usuario (el .md local se escribe en cada guardado, así que siempre existe), pero frágil si el archivo local se borra fuera de banda o se restaura en otra máquina sin los `.md`. Arreglo propuesto: distinguir "nota vacía" de "carga falló" y bloquear el guardado / mostrar la nota en solo-lectura cuando la carga falla. Requiere superficie de UI, pospuesto por presupuesto.
- [ ] **Nota: `createNote` deja fila huérfana si falla la escritura del .md** (`app/actions/notes.ts`, Sprint 3.3, reviewer M4). Crea la fila `Archivo` antes de `writeNoteMd`; si la escritura lanza, queda un `Archivo(kind=NOTE, path='')` visible como nota rota en /notes y /files. Añadir rollback (borrar la fila en el catch).
- [ ] **Nota: la migración descarta `Nota.taskId`** (`migrateLegacyNotes`, Sprint 3.3, reviewer M5). `Archivo` no tiene equivalente a la relación nota↔tarea. Hoy inocuo (0 notas legacy y `taskId` sin escritores en el código, confirmado por architect), pero si se resucita esa feature hay que portar el campo antes de migrar.
- [ ] **Nota: mensaje de migración puede sobrestimar** (`migrateLegacyNotes` + `app/settings/page.tsx`, Sprint 3.3, reviewer M6). Como `mirrorToDrive` traga los errores de Drive, el mensaje "N nota(s) movida(s) a Drive" se muestra aunque Drive estuviera caído y solo se guardara local. Distinguir "espejadas a Drive" de "solo locales" en el conteo.
- [ ] **Nota (menor): `MARKDOWN_MIME` duplicado** en `app/actions/notes.ts` y `app/lib/google-drive-files.ts` (Sprint 3.3, reviewer L1). Unificar en un solo lugar.
- [ ] **Nota (menor): sin cache-back tras bajar de Drive** (`getNoteContent`, Sprint 3.3, reviewer L2). Cuando baja el `.md` de Drive no lo reescribe local, así que /notes re-descarga cada nota en cada render si el local falta. Escribir el contenido bajado al `.md` local.
- [ ] **Nota (menor): colisión de boundary multipart improbable** (`buildMultipartBody`, `app/lib/google-drive-files.ts`, Sprint 3.3, reviewer L3). Si el contenido de una nota contiene el string del boundary `--ema-os-<ts>`, corrompe el request. Probabilidad ínfima; considerar boundary aleatorio robusto.
- [ ] **Command palette: el input de `select-project` no filtra la lista** (`app/components/CommandPalette.tsx`, Sprint 7.1, reviewer). En modo "elegir proyecto para tarea/nota" se renderiza un `<input>` plano cuyo valor no se usa para filtrar los `Command.Item` de proyectos — escribir ahí no hace nada. Con pocos proyectos no importa, pero si la lista crece hace falta buscar. Bajo impacto, no bloqueante.
- [ ] **Command palette: sin cancelación de request en carrera con "atrás"** (`app/components/CommandPalette.tsx`, Sprint 7.1, reviewer). Si el usuario dispara una creación (`busy=true`) y hace clic en "←" antes de que resuelva, no hay cancelación; si la petición en vuelo resuelve después, cierra la paleta de golpe aunque el usuario ya esté en otro modo. Impacto bajo (app de un solo usuario, ventana de carrera muy corta).
- [ ] **Command palette: el guard `busy` usa `useState`, no confirmado a prueba de doble-submit** (`app/components/CommandPalette.tsx`, Sprint 7.3, hallazgo propio). En Sprint 7.3 se descubrió que un guard `useState` para evitar doble-submit NO es fiable dentro de una transición de `<form action>` (verificado con un doble-submit real de 50ms que duplicaba filas en TaskBoard/NoteBoard — arreglado ahí con `useRef`). El `busy` de CommandPalette no está dentro de un `<form action>` (se dispara desde `onKeyDown`, no desde un form action de React), así que puede no tener el mismo problema, pero no se verificó con una prueba de doble-invocación real. Si aparece un reporte de creación duplicada desde la paleta, revisar esto primero.
- [ ] **Tarea optimista aparece al final de la lista, no en su posición ordenada** (`app/components/TaskBoard.tsx`, Sprint 7.3, reviewer). `optimisticTasks` inserta al final (`[...state, newTask]`) pero la lista real usa `byPriorityAndDueDate`; una tarea CRITICAL creada aparece momentáneamente al final y salta a su posición correcta cuando el servidor confirma. Cosmético, bajo impacto. `NoteBoard` no tiene este problema (inserta al frente, coincide con el orden real `createdAt desc`).
- [ ] **Mutex de mutación de tarea no unificado entre `TaskCard.tsx` y `TaskPriorityShortcut.tsx`** (Sesión de mejoras de UX, Parte 5, reviewer). `TaskCard.tsx` usa un `taskMutatingRef` compartido entre sus 3 controles cíclicos (prioridad/estado/completar) para evitar una condición de carrera real (encontrada y corregida esta sesión: un doble-click casi simultáneo entre el botón "✓ Completar" y el badge de estado podía sobrescribir `DONE` con un estado viejo después de que el evento de Calendar ya se hubiera borrado). Pero el atajo de teclado "P" (`TaskPriorityShortcut.tsx`, Sprint 7.2) tiene su propio `busyRef` totalmente desconectado — si el usuario presiona "P" con el mouse sobre una tarjeta justo cuando también hace clic en el badge de prioridad de esa misma tarjeta, puede perderse un paso del ciclo (menos severo que el bloqueante original: solo afecta `priority`, nunca `status`/`eventId` de Calendar). Además, el `catch` de `TaskPriorityShortcut.tsx` no distingue `NEXT_REDIRECT` como sí hacen los handlers de `TaskCard.tsx` (hoy inalcanzable, pero inconsistente). Arreglo propuesto: unificar el mutex por tarea (ej. un mapa `taskId → boolean` a nivel de módulo, o levantar el estado a un contexto compartido) entre ambos archivos. No bloqueante, verificado con pruebas reales de carrera (ambos órdenes de clic) que confirmaron que el caso bloqueante original SÍ quedó resuelto.
- [ ] **Limpieza de valor optimista depende de que el prop cambie, no de una señal explícita de "la petición terminó"** (`app/components/TaskCard.tsx`, Sesión de mejoras de UX, Parte 5, reviewer). El fix del "rebote" visual (limpiar `optimisticPriority`/`optimisticStatus` vía `useEffect` sobre `task.priority`/`task.status` en vez de en el `finally` inmediato) tiene un matiz de bajo riesgo: si una mutación externa concurrente sobre la misma tarea (dos pestañas, o el atajo "P") hace que el valor confirmado del server vuelva a coincidir con el valor previo al optimista (A→B→A), el `useEffect` no se dispara (dependencia sin cambio) y el badge queda desincronizado de la DB hasta la próxima mutación real. Escenario raro, no bloqueante.
- [ ] **My Day perdió el editor completo de estado (WAITING/IN_PROGRESS) en la sección "Hoy"** (`app/my-day/page.tsx`, Sesión con supervisión parcial, Parte 1, reviewer). Al reemplazar el `<AutoSubmitSelect>` viejo por `CompleteTaskButton` (solo completa, no cicla estados), esa vista ya no permite poner una tarea en WAITING/IN_PROGRESS sin ir a `/tasks` o `/projects/[id]` (que sí conservan el ciclo completo vía `TaskCard`). Regresión real pero aceptada: el pedido explícito era agregar "completar", no preservar el editor de estado ahí; ningún dato se perdió. Si se quiere recuperar, es un ítem explícito de backlog (ej. agregar el mismo badge cíclico de `TaskCard` a My Day), no algo para resolver ad hoc.

- [ ] **Acceso remoto fuera de casa con Tailscale** (Sesión con supervisión parcial, Parte 3d, 2026-07-13). Tailscale YA instalado y corriendo (`100.87.81.60`). Teléfono (Poco F7 Pro, `100.124.107.36`) ya enrolado. Bug: al activar VPN en el teléfono pierde internet general (comportamiento no-default — revisar si tiene activado "usar como exit node" / "Override local DNS"). Pendiente diagnóstico con dueño presente antes de recomendar para uso real.

### Ideas futuras (post-Fase 6)

- [ ] **Hermes Agent como canal de entrada por Telegram/WhatsApp.** Hermes ya instalado y configurado (Nous Research, MIT). Integración con EMA OS pendiente para sesión CON supervisión (toca la BD real). EMA OS es el cerebro, Hermes el canal — la lógica de negocio vive en EMA OS, Hermes solo invoca las tools del MCP server (Sprint 6.5). Agentes pendientes de definir con el dueño: Organizador, Comunicador, Seguridad. **No tocar en sesiones sin supervisión.**

### Known Issues
- Ninguno bloqueante actualmente. Ver Technical Debt para deuda no bloqueante conocida.

### Descartado (contradice decisiones ya tomadas)
- ~~Dark/light theme toggle~~ — la app es dark-only por decisión de diseño (ver skill `ui-guidelines`), no se agrega toggle de tema.
