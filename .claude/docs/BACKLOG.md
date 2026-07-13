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

- [ ] **Acceso remoto fuera de casa con Tailscale** (Sesión con supervisión parcial, Parte 3d, 2026-07-13). Siguiente paso natural tras el acceso LAN de esta sesión (`http://192.168.0.43:3000`, solo funciona dentro de la misma WiFi). **Descubrimiento al preparar esta parte: Tailscale YA está instalado y corriendo en esta PC** (`Get-Service Tailscale` → `Running`, IP tailnet `100.87.81.60`, nombre `desktop-htcerf9`) **y el teléfono del dueño (Poco F7 Pro) YA está enrolado en el mismo tailnet** (`100.124.107.36`, `poco-f7-pro`, offline al momento de anotar esto — última conexión hace 11h). Esto significa que el paso más grande (instalar y autenticar Tailscale en ambos dispositivos) probablemente ya está hecho de una sesión/uso previo del dueño no relacionado con EMA OS. Falta solo: (1) confirmar que el teléfono se conecta al tailnet cuando el dueño lo necesite (abrir la app Tailscale en el celular), (2) probar `http://100.87.81.60:3000` desde el teléfono conectado al tailnet mientras esté fuera de la WiFi de casa, (3) decidir si la regla de firewall de la Parte 3b (acotada a "Private") también cubre el tráfico de la interfaz Tailscale o si hace falta una regla aparte (Tailscale generalmente crea su propia interfaz de red que Windows puede clasificar como "Dominio"/"Pública" en vez de "Privada" — verificar antes de asumir que ya funciona). NO implementado/verificado en esta sesión — solo el descubrimiento de que la base ya existe. Gratis, VPN privada punto a punto, sin exponer ningún puerto a internet directamente (a diferencia de un port-forward en el router).

### Ideas futuras (post-Fase 6)

- [ ] **Hermes Agent como canal de entrada por Telegram/WhatsApp.** Usar
  Hermes Agent (agente open source de Nous Research, MIT, conectado vía
  OpenRouter con los créditos ya existentes del usuario) como interfaz
  conversacional externa a EMA OS. El usuario le escribe por Telegram
  (WhatsApp solo si se confirma que Hermes usa la API oficial de Meta, no
  una integración no oficial con riesgo de baneo — ver regla ya existente
  en `ROADMAP.md` "Qué NO hacer" sobre WhatsApp) y Hermes ejecuta acciones
  reales sobre la base de datos de EMA OS:
  - "Recuérdame revisar el expediente del IMPI" → crea la tarea (y evento
    de Calendar si aplica) en el proyecto correcto.
  - "Ya terminé X, Y, Z" → identifica las tareas existentes que coinciden
    y las marca completadas, CON CONFIRMACIÓN antes de marcar (no marcar a
    ciegas por ambigüedad de lenguaje natural).
  - Preguntas generales no relacionadas con los proyectos también deben
    poder responderse (Hermes no debe limitarse solo a CRUD).

  Requisitos técnicos a resolver cuando se aborde:
  - Se construye sobre el mismo tool-use de la Fase 6 (IA vía OpenRouter),
    no es una fase aparte — mismo mecanismo, canal de entrada distinto.
  - Recomendado correr Hermes en la misma máquina que EMA OS (evita
    exponer la base de datos local a un servidor externo).
  - Verificar primero si la integración de Hermes con WhatsApp usa la API
    oficial de Meta antes de conectar cualquier número real.
  - Diseñar el matching de lenguaje natural → tarea existente con
    confirmación explícita antes de acciones destructivas o de cierre.

  NO implementar hasta que la Fase 6 esté construida. Anotado 2026-07-11,
  sin implementar.

  **Actualización 2026-07-12**: el dueño ya instaló Hermes Agent (oficial
  de Nous Research) + Hermes Workspace (comunitario, outsourc-e),
  configurados entre sí y listos para usarse. La integración con EMA OS
  queda pendiente para una sesión CON supervisión (toca la base de datos
  real y decisiones de arquitectura) — no se toca en sesiones sin
  supervisión. Decisión ya tomada: **EMA OS es el cerebro, Hermes es el
  canal** — la lógica de negocio vive en EMA OS, Hermes solo invoca las
  tools que expone la Fase 6. Agentes a definir con el dueño más adelante
  (no ahora, requiere su decisión): un "organizador" (alimenta/clasifica
  el Inbox), un "comunicador" (responde mensajes por Telegram/WhatsApp), y
  un agente de "seguridad informática / configuración" (pedido explícito
  del dueño: revisar la postura de seguridad de la integración antes de
  exponer nada).

  **Nota de discrepancia (2026-07-12)**: se pidió reflejar este cambio
  también en `ROADMAP.md`, cambiando un encabezado de "Análisis
  comparativo de proyectos open source (≈65% del peso)" a "(100% open
  source)" bajo una supuesta "Fase 6.5". Ese texto y esa fase no existen
  en `ROADMAP.md` actual (verificado con grep, sin coincidencias) — no se
  aplicó el cambio para no editar contenido inexistente. Si la intención
  era otra sección o archivo, aclarar en la próxima sesión con
  supervisión.

### Known Issues
- Ninguno bloqueante actualmente. Ver Technical Debt para deuda no bloqueante conocida.

### Descartado (contradice decisiones ya tomadas)
- ~~Dark/light theme toggle~~ — la app es dark-only por decisión de diseño (ver skill `ui-guidelines`), no se agrega toggle de tema.
