<!-- ROTACIÓN 2026-07-18 — copia ciega del SPRINT.md activo antes del recorte -->

# SPRINT.md
## Current Sprint: Fase 6 completa — en main ✅ | Próximo: Fase 7 (UX avanzada)

### ✅ Sprint 6.1/6.2 — Generación de documentos desde plantillas (2026-07-18)

Modelo `DocumentTemplate` agregado a Prisma (id, name, docType, path, variables, projectId opcional).
Migración aditiva `20260718013940_add_document_templates` aplicada.
Server Actions en `app/actions/document-actions.ts`:
- `registerDocumentTemplate(formData)` — guarda plantilla en `./templates/` + registro en BD
- `generateDocxFromTemplate(templateId, data)` — usa docxtemplater + pizzip

Dependencias instaladas (excepción documentada): `docxtemplater`, `pizzip`.

UI mínima agregada en `/settings` para registrar plantillas (.docx o .md).

**Verificado**: `npm run build` limpio, Prisma Client regenerado.

### ⚠️ Discrepancia de numeración anotada

La tarea original pedía "Sprint 5.1/5.2 de Fase 5 — generación de documentos", pero el ROADMAP.md define:
- **Fase 5**: IA con OpenRouter (sprints 5.1-5.2-5.3)
- **Fase 6**: Documentos automáticos (sprints 6.1-6.2)

Se implementó **Fase 6 según ROADMAP.md**, no la numeración solicitada. El commit incluye esta anotación para que Claude Code vea la discrepancia.

### ✅ Sesión de revisión e integración (2026-07-18)

Revisión y merge de 4 ramas paralelas a main. Reviewer corrió el build
por su cuenta en cada rama antes de aprobar.

**Mergeado:**
- `senior-dev/backup-script` (0739e44) → PASS. `scripts/backup-db.ps1`,
  rotación 30 días con `CreationTime` (aceptable para uso local).
- `senior-dev/docs-readme` (5f4a749) → PASS con observación menor
  (falta newline al final de README.md, no bloqueante).
- `senior-dev/jsdoc-actions` (cd545ed) → PASS. JSDoc puro en
  `task-actions.ts`, cero cambios de lógica.
- `antigravity/ui-components` (999bde2) → PASS parcial. Los 3 componentes
  tsx (EmptyState, Badge, Skeleton) mergeados via cherry-pick selectivo.
  Dark-only, sin librerías nuevas, correctos.

**Rechazado / excluido:**
- `package.json` y `package-lock.json` del commit de Antigravity —
  instaló `@modelcontextprotocol/sdk` en el raíz sin que se pidiera.
  La dep ya existe en `mcp-server/package.json`. Excluida del merge.

**Incidente documentado:** reglas para trabajadores externos añadidas
a `CLAUDE.md` (sección nueva). Antigravity debe recibir feedback: si el
build falla por trabajo ajeno en vuelo, reportar y parar — no instalar
dependencias fuera de scope.

**Build limpio tras todos los merges**: confirmado `npm run build`.

---

### ✅ Sprint 6.5 — Servidor MCP local de EMA OS (2026-07-18)

Servidor MCP en `mcp-server/` (Node.js/TypeScript, stdio, paquete
independiente). Expone 9 tools: las mismas 4 de lectura y 4 de escritura
de las Fases 6.3/6.4, más `confirmar_accion`.

**Regla dura heredada**: las 4 tools de escritura (`crear_tarea`,
`crear_nota`, `completar_tarea`, `mover_archivo_a_proyecto`) devuelven
`pending_confirmation` + `confirmationId` en el primer llamado — ninguna
ejecuta sin pasar por `confirmar_accion({confirmationId, confirm:true})`.
Gate verificado por reviewer (único camino de escritura, sin bypass).

Fix de reviewer aplicado: `completar_tarea` y `mover_archivo_a_proyecto`
resuelven el ID de la entidad en el momento de la propuesta, no en el
ejecutor — evita ambigüedad por título cuando hay varias entidades con
nombres similares.

El servidor accede a Prisma directamente (sin importar nada de Next.js).
Dos procesos independientes sobre la misma SQLite: riesgo bajo para uso
local, documentado (architect).

**Verificado con cliente MCP real (JSON-RPC sobre stdio)**:
- 9 tools expuestas correctamente.
- `listar_proyectos` → 9 proyectos reales de la BD.
- `crear_tarea` → `pending_confirmation`, BD sin cambios.

Docs generados:
- `.claude/docs/MCP_HERMES.md` — instrucciones para conectar desde Hermes.
- `CLAUDE.md` sección "Modelos de OpenRouter" — cadenas :free para DEFAULT
  y Señor Dev.
- `.claude/docs/SKILL_AUDITORIA_MODELOS.md` — procedimiento mensual para
  que Dona audite que los modelos siguen siendo :free.

Siguiente paso natural: el usuario conecta Hermes a este servidor MCP
siguiendo `.claude/docs/MCP_HERMES.md`. Fase 7 (UX avanzada) queda
desbloqueada.

---

### ✅ Sprint 6.4 — Tool-use de escritura con confirmación real (2026-07-17)

El sprint más delicado de la Fase 6. Regla dura ("ninguna tool de
escritura ejecuta sin confirmación explícita del usuario") garantizada
en el código, no solo en el diseño — validado por architect (Opción B:
confirmación real de UI/servidor, nunca el modelo) y confirmado por
reviewer que `executeWriteTool` tiene un único call-site, dentro del
branch de confirmación, sin caminos alternativos.

4 tools nuevas en `app/lib/assistant-tools.ts` (`WRITE_TOOL_DEFINITIONS`):
`crear_tarea`, `crear_nota`, `completar_tarea` reusan Server Actions
existentes (`createTask`, `createNote`, `updateTaskStatus`);
`mover_archivo_a_proyecto` es lógica nueva mínima (un `prisma.archivo.update`
directo, sin Server Action existente que reusar — architect confirmó
aceptable, reviewer dejó nota de precedente si aparece una segunda
mutación de `Archivo` fuera de esto).

Mecanismo: `app/api/chat/route.ts` mantiene `PENDING_CONFIRMATIONS`
(Map en memoria, TTL 5 min) — cuando el loop encuentra un `tool_call`
de escritura, PARA ahí, genera un `confirmationId` propio y responde
JSON (`pending_confirmation`) en vez de ejecutar. El cliente
(`/assistant`) renderiza botones reales "Confirmar"/"Cancelar"; solo
un clic real dispara la segunda petición (`{confirmationId, confirm}`)
que el servidor resuelve con los args que ÉL guardó (el cliente nunca
manda los args de vuelta). El id se borra al usarse (protección
replay).

**Verificado contra datos reales, incluyendo los casos de seguridad
más importantes** (no solo el camino feliz):
1. Primera petición → `pending_confirmation`, confirmado en BD que NO
   se ejecutó nada todavía.
2. Confirmación real (`confirm:true`) → tarea creada de verdad en BD.
3. **Replay del mismo `confirmationId` ya usado** → rechazado
   ("confirmación ya expiró o no es válida"), confirmado que no se
   ejecutó dos veces.
4. Cancelar (`confirm:false`) → "Acción cancelada", confirmado en BD
   que no cambió nada.
5. **Navegador real, clic real** (no solo curl): mensaje real → propuesta
   con botones reales → clic físico en "Confirmar" → `status: DONE`
   confirmado en BD.
6. Artefactos de prueba limpiados.

Reviewer: sin bloqueantes. Aplicado 1 fix menor (validar `prioridad`
contra el enum antes de construir el `FormData`, y `titulo` no vacío).
2 hallazgos de severidad media/baja documentados en `BACKLOG.md`
(asunción de proceso único del Map en memoria — riesgo de
disponibilidad, no de seguridad; `createTask`/`crearNota` invocados
fuera de su contrato original de formulario).

**Sprint 6.5 (priorización asistida) — NO implementado.** Opcional
por diseño ("si sobra presupuesto"), prioridad más baja de la fase, y
el presupuesto de la sesión se cerró en Fase 6.4. Queda como siguiente
paso natural para una sesión futura: la IA propone un plan de "My Day"
que el usuario aprueba o edita (modelo Sunsama, nunca auto-agenda). El
mecanismo de confirmación de 6.4 (Map + confirmationId + botones
reales) es directamente reusable ahí.

---


### ✅ Sprint 6.3 — Tool-use de solo lectura (2026-07-17)

`app/lib/assistant-tools.ts` nuevo: 4 tools (`listar_proyectos`,
`listar_tareas`, `buscar_tareas_por_texto`, `leer_nota_contexto`),
todas invocando Prisma/`getNoteContent` ya existentes, ninguna
escribe. `app/api/chat/route.ts` reescrito con loop de tool_use
(máximo 3 rondas, arquitectura confirmada por architect: decisión
sin streaming, respuesta final directa sin re-llamar innecesariamente).

**Cambio de modelo importante**: `DEFAULT_MODEL` pasó de
`openrouter/free` (auto-router no determinístico) a
`nvidia/nemotron-nano-9b-v2:free` (modelo fijo). Motivo verificado
contra la API real: al probar tool-calling, `meta-llama/llama-3.3-70b-instruct:free`
y `qwen/qwen3-coder:free` devolvieron 429 (rate-limited por el
proveedor en ese momento), `openai/gpt-oss-20b:free` devolvió 402
(quota insuficiente del lado del proveedor) — `nvidia/nemotron-nano-9b-v2:free`
respondió con un `tool_calls` bien formado en la prueba real. Sigue
siendo gratuito, solo se fijó en vez de dejarlo al auto-router.

Reviewer: sin bloqueantes. Aplicado 1 ajuste menor sugerido (loguear
`tool_call.arguments` crudo si el `JSON.parse` falla, para debug
futuro). Limitación conocida y documentada en la tool misma:
`buscar_tareas_por_texto`/`proyecto_nombre` no distinguen acentos
(`ó` ≠ `o` en SQLite `LIKE`) — aceptado, no se normaliza (alcance no
pedido, sin evidencia de que sea un problema práctico).

**Verificado contra datos reales, sin mocks**: `listar_tareas`
(Barrera de sargazo) devolvió "4", exacto contra `COUNT(*)` directo a
la BD; `leer_nota_contexto` (Xalma Residencial) devolvió el contenido
real de la nota ("Carretera Costera del Golfo"); `buscar_tareas_por_texto`
("IMPI") devolvió el título exacto real; `listar_proyectos` en
navegador real listó los 9 proyectos reales incluyendo estados
PAUSADO/PLANNING que el resumen fijo del system prompt (Sprint 6.2)
no cubre — confirma que las tools traen datos más allá del contexto
fijo, el punto central de este sprint.

---


### ✅ Sprint 6.2 — Inyección de contexto de proyectos (2026-07-17)

Ver commit `d9a5dbf`. `app/lib/assistant-context.ts` nuevo:
`buildSystemPrompt()` combina `MASTER_CONTEXT.md` + resumen en vivo de
proyectos ACTIVE (Prisma). System prompt siempre armado server-side,
mensajes `role: 'system'` del cliente descartados. Prompt caching
documentado como no aplicable hoy (ningún modelo en uso real lo
soporta) — no implementado a propósito, evita funcionalidad fantasma.

Bug propio (fallback 429 sin contexto) encontrado y corregido antes de
pedir revisión. Reviewer: sin bloqueantes. Riesgo de prompt injection
vía mensajes de usuario documentado en `BACKLOG.md` — relevante sobre
todo para Sprint 6.4 (tool-use de escritura).

**Verificado con datos reales**: pregunta sobre next action de Xalma
Residencial devolvió el título exacto de la BD; pregunta en navegador
sobre proyectos activos devolvió "7 proyectos" con la lista real,
coincidiendo con el conteo ya conocido.

---


### ✅ Sprint 6.1 — Endpoint de chat con streaming + UI mínima (2026-07-17)

Ver commit `1b17fb9`. `app/api/chat/route.ts` (Route Handler, primer
streaming del proyecto) + `app/assistant/page.tsx` (Client Component).
Modelo `openrouter/free` por defecto, fallback a `openai/gpt-4o-mini`
en 429. Reviewer encontró y se corrigió 1 bloqueante (wrapper de
layout duplicado, violaba `ui-guidelines`) — re-verificado tras el fix.

**Verificado contra la API real**: llamada directa confirmó el modelo
real detrás del auto-router (`nvidia/nemotron-nano-9b-v2:free` esa
vez); 2 pruebas de streaming vía `curl` con texto correcto; prueba en
navegador real (mensaje real enviado, respuesta visible en streaming,
confirmado tras el fix de layout); validación de `messages` vacío
devuelve 400 sin crashear.

---


### ✅ Prerrequisito resuelto (2026-07-17)

`OPENROUTER_API_KEY` agregada por el dueño a `.env`. Verificada contra
la API real (`GET /api/v1/auth/key`): key válida, $4.28 de crédito
disponible. Modelo por defecto confirmado: `openrouter/free` (ya
documentado en ROADMAP.md, verificado que sigue siendo un id real y
activo consultando `GET /api/v1/models`). Architect consultado para el
diseño del Route Handler de streaming antes de escribir código.

---


### ✅ Parte 2 — rtk instalado (2026-07-14, continuación con presupuesto extra)

Binario `rtk-x86_64-pc-windows-msvc.zip` v0.43.0 descargado del GitHub
Releases oficial de `rtk-ai/rtk` (NO crates.io, es otro proyecto —
confirmado antes de instalar). Checksum SHA256 verificado contra
`checksums.txt` de la release antes de ejecutar nada. Instalado en
`C:\Users\EdEma\AppData\Local\rtk\bin\rtk.exe`, agregado al PATH de
usuario (persistente, sin requerir Admin). `rtk init --global`
registró `RTK.md` + referencia `@RTK.md` en el `CLAUDE.md` global del
usuario. Verificado: `rtk --version` → `rtk 0.43.0`; `rtk git status`
funcionó dentro del repo de EMA OS; `rtk gain` mostró 66.7% de ahorro
de tokens en esa llamada.

### ✅ Parte 3 — Ponytail instalado en modo lite (2026-07-14)

Instalado como plugin de Claude Code. Modo "lite" activado de forma
persistente: `%APPDATA%\ponytail\config.json` con `{"defaultMode": "lite"}`.
Sin conflicto con CLAUDE.md. Ver commit para detalle.

---


### 📊 Reporte de estado del ROADMAP (Parte 4, 2026-07-14)

**Fases 100% completas**: 0 (MVP), 1 (Priorización), 4 (Calendar,
4.1-4.4), 7 (UX avanzada), 9.1-9.4 (Interactividad; 9.5 opcional sin
tocar). Además sesión de mejoras de UX y sesión con supervisión parcial.

**Parcial**: Fase 3 (Drive) — Sprint 3.5 (rclone bisync) pendiente.

**Sin empezar**: Fase 2, Fase 5, Fase 6.5 (Hermes), Fase 10.

---

## ✅ Sesión de mejoras de UX (2026-07-12) — Partes 0-6, todas completas

Rediseño interactivo completo de la app. Badges cíclicos, dashboard
clicable, renombre a "Organizador de archivos", MXN, simplificación de
/files, Fase 9 completa (9.1-9.4). Ver commits de la sesión para
detalle completo.

---

## ✅ Fase 4 — Google Calendar (4.1-4.4 completos, 2026-07-12)

4.2: sync tarea↔evento (create/update/delete). 4.3: recordatorios
configurables (DEFAULT=3+5d, ONE_DAY, NONE, etc.). 4.4: agenda 7 días
en dashboard. Todo verificado contra la API real de Calendar
(eduardocortezpena@gmail.com).

---

## ✅ Fases 0, 1, 3, 7 — completadas en sesiones anteriores

Ver archive/SPRINT_HISTORICO.md para el detalle de los sprints
0.1-0.5, 1.1-1.4, 3.1-3.4, 7.1-7.4.

### Notas técnicas permanentes
- Tras CUALQUIER migración de Prisma: `npx prisma generate` + reiniciar
  el PROCESO de `npm run dev` (no solo reused: true en preview_start).
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` y
  `ENCRYPTION_KEY` en `.env` local (nunca en git).
- `app/lib/google-drive-auth.ts` (`getValidAccessToken`) = punto de
  entrada para cualquier llamada a Drive/Calendar — reusar.
- Llamadas de red vía `node -e` en Bash pueden ser interceptadas por
  context-mode ("Inline HTTP redirected") — usar PowerShell si pasa.

### Blockers activos
- Ninguno para lo ejecutado. Siguiente: usuario conecta Hermes al MCP
  server siguiendo `.claude/docs/MCP_HERMES.md`.
- Sprint 3.5 (rclone bisync) requiere sesión supervisada.
