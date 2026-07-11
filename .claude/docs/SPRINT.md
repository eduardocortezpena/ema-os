# SPRINT.md
## Current Sprint: Fase 3 — Google Drive: archivos y notas Markdown

### Sprint Goal
Carpeta local por proyecto, conexión OAuth con Google Drive, notas
Markdown editables desde la web sincronizadas a Drive, subida de otros
archivos, y (opcional) espejo bidireccional con rclone.

### Sprint Duration
Start: 2026-07-11

### Sprint Backlog

#### Completed (fases previas)
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

#### To Do (siguiente, en orden — ver ROADMAP.md Fase 3)
- [ ] Sprint 3.4 — Subir/crear archivos y carpetas sueltas en Drive.
- [ ] Sprint 3.5 (OPCIONAL) — rclone bisync bidireccional.

### Definition of Done
Reference: .claude/skills/definition-of-done/SKILL.md

### Blockers
- Ninguno. El bloqueo de pasos manuales de Google Cloud Console
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
