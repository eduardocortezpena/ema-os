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

### Known Issues
- Ninguno bloqueante actualmente. Ver Technical Debt para deuda no bloqueante conocida.

### Descartado (contradice decisiones ya tomadas)
- ~~Dark/light theme toggle~~ — la app es dark-only por decisión de diseño (ver skill `ui-guidelines`), no se agrega toggle de tema.
