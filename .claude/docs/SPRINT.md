# SPRINT.md
## Current Sprint: Fase 6 — IA vía OpenRouter (6.1, 6.2 completos; 6.3 en curso)

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

**Riesgo residual no verificado**: el path de fallback en 429 está en
el código (revisado y confirmado correcto por el reviewer a nivel de
lógica — no crashea si el fallback también falla) pero **no se probó
con un 429 real** — no se quiso abusar del rate limit del pool
gratuito para forzarlo. Si en el futuro se ve un error real de
fallback, revisar aquí primero.

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

**Hallazgo real durante la instalación**: el hook `PreToolUse` que
`rtk init` pide agregar a `~/.claude/settings.json` se activó a mitad
de esta misma sesión (los hooks no esperan a un reinicio, se leen en
vivo) y rompió los comandos de Bash siguientes, porque reescribe
comandos internamente usando `rtk` sin ruta completa, y el PATH de
usuario recién actualizado no lo ve el proceso de Bash ya abierto
(solo procesos nuevos lo heredan). Se desactivó el hook de inmediato,
se terminó el resto del trabajo de la sesión sin él, y se reactivó
como el último cambio antes de cerrar (ver abajo) — así que debería
funcionar correctamente ya en la próxima sesión/terminal nueva sin
sorpresas.

### ✅ Parte 3 — Ponytail instalado en modo lite (2026-07-14)

Instalado como plugin de Claude Code (mecanismo nativo: `claude plugin
marketplace add DietrichGebert/ponytail` + `claude plugin install
ponytail@ponytail`), confirmado `enabled` en `settings.json`. Igual
que pasó con `frontend-design` en una sesión anterior: un plugin
instalado a mitad de sesión no aparece en la lista de skills
invocables de esa misma sesión (requiere reiniciar Claude Code) — así
que no se pudo probar el slash command `/ponytail lite` en vivo.

Se activó el modo "lite" de forma persistente sin depender del slash
command: archivo `%APPDATA%\ponytail\config.json` con
`{"defaultMode": "lite"}` (orden de resolución documentado por el
propio plugin: variable de entorno > archivo de config > `full` por
defecto — sin variable de entorno seteada, el archivo de config manda).

**Verificación de choque con CLAUDE.md**: sin conflicto. El modo lite
("construir lo pedido, nombrar la alternativa más perezosa en una
línea") refuerza directamente las reglas ya existentes del proyecto
("Simplicidad", "Nunca agregar funcionalidades no solicitadas") y no
toca el proceso de verificación/Definition of Done, que es un área
distinta. `CLAUDE.md` sigue siendo la autoridad en cualquier caso de
duda futura, tal como pidió el dueño.

**Pendiente para el dueño**: reiniciar Claude Code para que
`ponytail:ponytail` y el resto de sus skills queden invocables
(`/ponytail`, `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt`,
`/ponytail-gain`, `/ponytail-help`), y para que el hook de `rtk` quede
activo desde el arranque limpio.

---


### 📊 Reporte de estado del ROADMAP (Parte 4, 2026-07-14)

**Fases 100% completas**: 0 (MVP), 1 (Priorización), 4 (Calendar,
4.1-4.4), 7 (UX avanzada), 9.1-9.4 (Interactividad; 9.5 opcional sin
tocar). Además, fuera de la numeración de fases: Sesión de mejoras de
UX y Sesión con supervisión parcial (renombrado, tareas cíclicas,
botón completar, `/calendar`, acceso LAN) — todas cerradas con
reviewer y verificación real.

**Parcial**: Fase 3 (Drive) — OAuth/notas/subida funcionan, Sprint 3.5
(rclone bisync) con plan documentado pero `rclone` sin instalar,
ejecución pendiente de sesión supervisada.

**Sin empezar**: Fase 2 (Clasificador de archivos — nota: ya existe un
agente Organizador real operando por fuera de EMA OS, ver `AGENTES.md`
y la discrepancia de autonomía anotada ahí), Fase 5 (Documentos
automáticos), Fase 6 (IA/OpenRouter tool-use), Fase 6.5 (integración
Hermes — borrador de diseño listo, cero código), Fase 10 (Estilización
— deliberadamente abierta).

**Ideas nuevas registradas esta sesión** (añadidas a `BACKLOG.md`):
nueva pestaña de inventario en EMA OS + perfil agéntico
"Inventarista". El dueño hará el primer inventario manual en su viaje
a Xalma esta semana; quiere cotejo automatizado en la próxima
quincena — sin implementar todavía, requiere diseño en sesión
dedicada.

**Recomendación del siguiente paso técnico**: cerrar el diagnóstico
del bug de Tailscale (bloquea el objetivo real de "acceso remoto fuera
de casa" que el dueño pidió explícitamente) antes de abrir cualquier
fase nueva — es la pieza que quedó rota de la sesión anterior, no
deuda vieja. Después, Fase 6 (tool-use) es el siguiente bloque grande
con más apalancamiento (desbloquea Hermes/Fase 6.5 y el agente
Inventarista al mismo tiempo).

### 🗂️ Auditoría de memoria (Parte 1, 2026-07-14)

Inventario completo de archivos de contexto reportado al dueño en
chat. Propuesta de consolidación: archivar (no borrar)
`PROJECT_CONTEXT.md`, `PROJECT_MEMORY.md`, `OWNER_PROFILE.md`,
`NEXT_SESSION.md`, `MEMORY.md`, `VISION.md` — todos sin tocar desde
2026-07-09 (scaffold inicial), superados en la práctica por
`SPRINT.md`/`BACKLOG.md`. **Esperando aprobación del dueño antes de
mover/borrar nada** — no ejecutado en esta sesión. Generado
`MASTER_CONTEXT.md` (raíz del repo, ≤2 páginas) como resumen para
cargar a Dona en Hermes.

**Partes 2 (rtk) y 3 (ponytail) de esta sesión: NO ejecutadas** —
presupuesto de tokens llegó a su límite semanal (~5% restante,
advertido por el dueño). Priorización explícita del dueño era
"1 > 4 > 2 > 3"; se cerraron 1 y 4 en verde, se paró ahí en vez de
dejar una instalación de herramienta externa a medias. Pendiente para
la próxima sesión.

---

### ✅ Parte 1 — Botón compacto de completar tarea (5 vistas)
Ver commit `044305f`. `CompleteTaskButton.tsx` nuevo (standalone, no
comparte lógica con `TaskCard.tsx` por decisión de architect — evita
acoplar el mutex de 3 controles ya probado). Verificado en navegador+DB
en las 5 vistas: dashboard (Siguientes acciones + Agenda), My Day,
/tasks, /projects/[id]. Reviewer: sin bloqueantes. Regresión menor
documentada en BACKLOG.md (My Day perdió el ciclo completo de estado,
solo completar).

### ✅ Parte 2 — Vista /calendar
Ver commit `b1d0175`. Calendario mensual CSS Grid puro (sin librerías),
navegación `?year=&month=`, link genérico a Google Calendar (sin
deep-link a evento — el `id` de la API no es el `eid` de la URL web).
Verificado con datos reales de Xalma Residencial. Reviewer: sin
bloqueantes. Deuda de timezone en `dueDate` documentada en BACKLOG.md
(preexistente de Sprint 4.2, no introducida por esta vista).

### ✅ Parte 4 — AGENTES.md (borrador)
Ver commit `633981f`. Diseño de 3 agentes (Organizador, Comunicador,
Seguridad/Configuración) + sección de seguridad del sistema completo
(credenciales reales, qué expone el acceso LAN, mínimo privilegio).
Marcado explícitamente como borrador — nada configurado en Hermes.

**Hallazgo relevante durante la Parte 5**: ya existe un agente
Organizador REAL corriendo por fuera de EMA OS/Hermes-tools todavía
(`C:\Users\EdEma\Desktop\Proyectos\AGENTS.md`), con **más autonomía**
que la propuesta cautelosa de este borrador — su propio `AGENTS.md`
dice "Mueves archivos por tu cuenta, sin pedir aprobación previa,
SIEMPRE que la clasificación sea clara". Esto es una discrepancia real
entre lo que propuse (fase inicial con aprobación manual) y lo que el
dueño ya tiene operando. **No se tocó nada de ese agente ni de su
configuración en esta sesión** — solo se detectó al inventariar su
carpeta de salida para la Parte 5. Aclarar con el dueño en la próxima
sesión si `AGENTES.md` debe actualizarse para reflejar la autonomía
real ya en uso, o si el agente existente debe ajustarse al criterio
más cauteloso del borrador.

### 🔄 Parte 3 — Acceso LAN desde el teléfono
- **3a (bind 0.0.0.0)**: no hizo falta tocar `npm run dev` ni
  `EMA_Launcher.ps1` — confirmado que Next.js ya escucha en todas las
  interfaces por defecto (`Get-NetTCPConnection` mostró `LocalAddress: ::`,
  y `curl http://192.168.0.43:3000/dashboard` respondió 200 desde antes
  de tocar nada).
- **3b (firewall)**: comando ejecutado por el dueño (requería PowerShell
  como Administrador, UAC no se puede aprobar remotamente):
  ```powershell
  New-NetFirewallRule -DisplayName "EMA OS LAN (puerto 3000)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Private
  ```
  **Hallazgo durante la ejecución**: la interfaz Wi-Fi estaba clasificada
  por Windows como "Pública", no "Privada" — la regla acotada a
  `-Profile Private` no habría funcionado en la WiFi real sin este paso
  adicional (confirmado con el dueño antes de ejecutar):
  ```powershell
  Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
  ```
  Ambos comandos confirmados aplicados: `Get-NetConnectionProfile` →
  Wi-Fi = Private; `Get-NetFirewallRule` → regla activa, perfil Private,
  dirección entrante, puerto 3000.
- **3c (IP + URL)**: IP LAN real de la PC: `192.168.0.43`. URL para
  probar desde el Poco F7 Pro (Brave, misma WiFi):
  `http://192.168.0.43:3000/dashboard`. **Esperando confirmación del
  dueño desde su teléfono** (DoD explícito: "el usuario confirma desde
  su teléfono que el dashboard carga y es usable").
- **3d (BACKLOG Tailscale)**: agregado a `BACKLOG.md`. Hallazgo
  importante: Tailscale YA está instalado, corriendo, y el teléfono del
  dueño YA está enrolado en el mismo tailnet (`100.87.81.60` /
  `100.124.107.36`, offline al momento de anotar) — de una configuración
  previa no relacionada con EMA OS. Falta solo probar
  `http://100.87.81.60:3000` desde el teléfono fuera de la WiFi de casa,
  y confirmar que la interfaz Tailscale (ya "Private") no necesita una
  regla de firewall aparte (la regla del puerto 3000 ya cubre cualquier
  interfaz clasificada como Private, así que Tailscale debería
  funcionar ya con la misma regla — no verificado explícitamente en esta
  sesión).

### 📋 Parte 5 — Preparación del espejo a Drive (SOLO análisis, sin ejecutar)

**5a — Inventario de la carpeta organizada** (`C:\Users\EdEma\Desktop\Proyectos`,
organizada por el agente Organizador mencionado arriba):
- **306 archivos, 72 carpetas, ~1.09 GB total.**
- Estructura (resumen; árbol completo disponible en el propio
  `Proyectos\AGENTS.md` del dueño):
  ```
  Proyectos/
  ├── _INBOX/          (0 archivos — vacío, listo para recibir)
  ├── _LOG/            (2 archivos — bitácora de movimientos)
  ├── _MEMORIA/sesiones/ (1 archivo)
  ├── AMH/             (Arte en Madera y Hierro: 3 + subcarpetas con 147
  │                      archivos — fotos crudas, editadas, IA)
  ├── AntiSargazo_Project/ (vacío)
  ├── Asociación Civil/ (2 archivos)
  ├── Barrera y panga antisargazo/ (14 archivos entre subcarpetas)
  ├── Nuevo X Habbin/  (venta de terrenos — 12 clientes con
  │                      Contratos/Identificacion/Recibos, ~40 archivos)
  ├── Xalma Residencial/ (venta de terrenos — 1 cliente + Marketing
                          (22) + Legal_Planos (10) + Finanzas (2))
  ```
- **⚠️ Nota de sensibilidad**: `Nuevo X Habbin` y `Xalma Residencial`
  contienen identificaciones, contratos y recibos de clientes reales
  (nombres completos en las rutas de carpeta). Esto sube a Drive como
  cualquier otro archivo — sin cifrado adicional propio de EMA OS. El
  dueño debe confirmar que su cuenta de Drive es privada/personal antes
  de subir (no una compartida/de trabajo con acceso de terceros).

**5b — Esquema espejo propuesto y plan de subida inicial**:
1. **Estructura espejo**: idéntica a la local, una carpeta raíz "Proyectos"
   en Drive con la misma jerarquía (`rclone` con `bisync` replica la
   estructura de carpetas automáticamente, no hace falta crearla a mano).
2. **Prerequisito no cumplido todavía**: `rclone` **no está instalado**
   en esta máquina (`rclone version` → comando no encontrado). Antes de
   cualquier ejecución hace falta: instalar rclone, configurar un remote
   de Google Drive (`rclone config`, flujo OAuth propio de rclone,
   independiente del OAuth de la app EMA OS), y confirmar el remote con
   `rclone lsd remote:` antes de tocar datos reales.
3. **Respaldo previo local OBLIGATORIO** antes del primer `--resync`:
   copia completa de `C:\Users\EdEma\Desktop\Proyectos` (1.09 GB, cabe
   en cualquier USB/disco externo o un segundo destino en la misma PC)
   — condición no negociable ya establecida en `BACKLOG.md` Sprint 3.5.
4. **Primera corrida con `--resync`** (obligatoria, establece la línea
   base — sin esto `bisync` no sabe el estado previo).
5. **Flags robustos**: `--resilient --recover --conflict-resolve newer --drive-skip-gdocs`.
6. **Prueba piloto con UNA subcarpeta pequeña primero**: candidata
   `_LOG/` (2 archivos, bajo riesgo) o `AntiSargazo_Project/` (vacía,
   riesgo cero) antes del volcado total — confirmar que el ciclo
   completo (subir, bajar, resolver un conflicto simulado) funciona
   antes de arriesgar `Nuevo X Habbin`/`Xalma Residencial` (las carpetas
   con datos sensibles de clientes).
7. **Solo después de (6) exitoso**: bisync de la carpeta completa.

**5c — PARADO aquí, según lo pedido.** Nada de esto se ejecutó. La
ejecución de la subida inicial (instalar rclone, configurar el remote,
el respaldo previo, el `--resync` inicial, y la prueba piloto) se hace
en una sesión futura con el dueño presente, confirmando cada paso — no
en modo autónomo ni en el resto de esta sesión con supervisión parcial.

---



### ✅ Sesión de mejoras de UX (2026-07-12) — Partes 0-6, todas completas

Pedido del dueño tras usar la app en serio. Documentar primero (Parte 1),
luego ejecutar de a una parte, con `architect` antes de decisiones
estructurales y `reviewer` al cerrar cada bloque grande — verificación en
navegador para todo (feedback de UX, el build limpio no basta).

**Parte 0 — Skill `frontend-design`**: instalada y habilitada
(`frontend-design@claude-plugins-official`, marketplace oficial ya
configurado). No aparece en la lista de skills invocables de esta misma
sesión — los plugins instalados a mitad de sesión requieren reiniciar
Claude Code para cargarse como skill formal. Se leyó su `SKILL.md`
directo y se usó como guía (moderación, motion deliberado) combinada con
`ui-guidelines` (que sigue siendo la autoridad de la paleta dark).
**Pendiente para el dueño**: reiniciar Claude Code para que la skill
quede disponible como `/frontend-design` en próximas sesiones.

**Parte 1 — ROADMAP.md/BACKLOG.md**: Fase 10 "Estilización y pulido
visual" agregada, deliberadamente abierta (sin sprints) a la espera de
que el dueño consiga herramientas de animación/diseño adicionales.
Documentados los pendientes de sesión supervisada (Hermes, árbol de
directorio de `/files`). El texto "(~65% del peso)" pedido para corregir
NO existe en ningún archivo del repo (confirmado con grep, segunda vez
que se verifica — ya documentado como discrepancia en sesión anterior).

**Parte 2 — Renombre + moneda**: `<title>` y header del sidebar ahora
"Organizador de archivos" (nombre técnico en `package.json` sin tocar).
`/settings` muestra MXN por defecto (botón estático sin lógica de
conversión, USD documentado en tooltip como opción futura).

**Parte 3 — Tarjetas de dashboard clicables**: "Proyectos totales" →
`/projects`, "Activos" → `/projects?estado=activo`, "Tareas abiertas" →
`/tasks?estado=abiertas`. Filtrado server-side (mismo patrón que Sprint
9.4), sin nuevo client component (architect: es navegación, no un
control interactivo). Verificado: 7 activos, tareas TODO/IN_PROGRESS
coinciden con los conteos reales.

**Parte 4 — Nota de contexto fuera de la vista** (cambio de rumbo vs.
Sprint 9.1/9.3): `/projects/[id]` ya no renderiza la nota de contexto,
pero se conserva íntegra en Drive + índice SQLite (será el contexto de
futuros agentes organizadores). `app/actions/notes.ts` intacto — sigue
en uso real vía command palette (`quickCreateNote`). Verificado: nota de
Xalma Residencial con 1495 bytes reales en disco y `driveFileId` intacto
tras el cambio.

**Parte 5 — Rediseño interactivo de tareas** (la más grande, prioridad
del dueño): badges de prioridad y estado ahora son botones cíclicos
(clic rota el valor con su color, `transition-colors` nativo sin
librería), más un botón compacto "✓" que salta directo a DONE (reusa
`updateTaskStatus`, conserva el borrado del evento de Calendar de Sprint
4.2). Reviewer encontró un **bug bloqueante real**: 3 refs de guard
independientes permitían que un clic casi simultáneo entre "✓ Completar"
y el badge de estado sobrescribiera DONE con un estado viejo después de
borrado el evento de Calendar. **Corregido** con un mutex compartido
(`taskMutatingRef`) entre los 3 controles + fix del rebote visual del
optimistic UI (limpieza vía `useEffect` en vez de en el `finally`
inmediato). Re-verificado forzando la carrera exacta en ambos órdenes de
clic contra la DB real — confirmado que solo el primer click gana en
ambos casos. Deuda menor documentada en BACKLOG.md (mutex no unificado
con el atajo de teclado "P" existente, Sprint 7.2).

**Parte 6 — `/files` simplificado**: quitado el widget de subida por
proyecto; la sección ahora es un placeholder honesto ("el directorio se
está rediseñando"). `app/actions/files.ts` y los helpers de Drive
intactos (mismo criterio que Parte 4). Confirmado 0 archivos tipo FILE
existentes hoy — no se perdió ninguna vista de datos reales.

**Estado final verificado**: `git status` limpio, `npm run build`
limpio, 8 commits de esta sesión (uno por parte o sub-bloque grande,
como se pidió). Ningún artefacto de prueba quedó en la DB (verificado
uno por uno tras cada test).

**Nada bloqueante pendiente para el dueño.** Único paso manual sugerido:
reiniciar Claude Code para que la skill `frontend-design` quede
disponible como slash command en la próxima sesión.

---

## Current Sprint (histórico): Fase 4 — Google Calendar (4.1, 4.2, 4.3, 4.4 completos)

### Sprint Goal
Fase 9 en pausa (9.1-9.4 completos; 9.5 pendiente/opcional). Fase 4
completa: Sprint 4.1 completo y verificado con la cuenta real del usuario;
4.2/4.3/4.4 desbloqueados y completados en esta sesión (sin supervisión)
tras recibir las 2 decisiones de producto pendientes directamente del
dueño al abrir la sesión (ver sección "✅ Sprint 4.2" más abajo para el
detalle y la evidencia).

### ✅ Sprint 4.2 — Tarea con proyecto+fecha → evento Calendar (2026-07-12)

**Decisiones de producto recibidas al abrir esta sesión** (resuelven el
bloqueo de la sesión anterior): P1 — solo tareas CON proyecto sincronizan
a Calendar (Inbox sin proyecto, no). P2 — eventos de todo el día (campo
`date`, no `dateTime`; sin tocar el `<input type="date">` existente).

Architect confirmó el plan ya documentado en sesión previa sigue vigente
contra el código real, sin ajustes de fondo. Implementado: `Tarea.eventId
String?` (migración aditiva `20260712000000_tarea_event_id`, mismo patrón
que `Archivo.driveFileId`); `app/lib/google-calendar.ts` nuevo
(`createCalendarEvent`/`updateCalendarEvent`/`deleteCalendarEvent`, 404/410
tratados como éxito idempotente); `syncCalendarEvent` en `task-actions.ts`
decide crear/actualizar/borrar según proyecto+fecha, degrada graceful igual
que `mirrorToDrive` (Calendar caído nunca bloquea guardar la tarea); nueva
Server Action `updateTaskDueDate` (no existía forma de editar `dueDate`
post-creación); `updateTaskStatus` borra el evento al completar (DONE);
`deleteTask` borra el evento antes de borrar la tarea; input de fecha
inline editable en `TaskCard.tsx`.

**Verificado contra la API real de Calendar** (cuenta
`eduardocortezpena@gmail.com`, artefactos de prueba limpiados): crear tarea
con proyecto+fecha → evento real confirmado (todo el día, título exacto);
editar fecha → mismo `eventId` (PATCH, sin duplicar), fecha movida
confirmada en la API; completar tarea (DONE) → evento cancelado
confirmado, `eventId` limpiado en DB; borrar tarea → evento cancelado
confirmado, fila borrada de DB.

Reviewer encontró **2 bugs bloqueantes reales** en la primera pasada: (1)
el input de fecha inline no tenía guard anti doble-submit — riesgo real de
crear eventos duplicados en Calendar con dos cambios casi simultáneos
(mismo tipo de bug ya resuelto en Sprint 7.3 para `TaskBoard.tsx`, no
aplicado aquí); (2) `deleteProject` no limpiaba `Tarea.eventId` de las
tareas afectadas por `onDelete: SetNull` (Sprint 7.4) — dejaba eventos
huérfanos vivos en el Calendar real del usuario al borrar un proyecto.
Encontró además un hallazgo menor: `createTask` sincronizaba Calendar
*antes* de crear la fila en DB (riesgo de evento huérfano sin fila que lo
referencie si el `create` fallaba después) — inconsistente con el orden ya
establecido por `mirrorToDrive` en `notes.ts`.

**Los 3 corregidos y re-verificados**: guard `useRef` por instancia añadido
al form de fecha en `TaskCard.tsx` (mismo patrón que `TaskBoard.tsx`,
confirmado por reviewer que no se comparte entre tarjetas porque cada
`TaskCard` es una instancia por tarea); `deleteProject` ahora borra los
eventos de Calendar de las tareas afectadas (best-effort, no bloquea el
borrado del proyecto) y limpia `eventId: null` — **verificado con un
proyecto+tarea desechables creados y borrados en esta sesión**: evento
confirmado `status: cancelled` en la API real tras borrar el proyecto,
`eventId: null` en la tarea sobreviviente; `createTask` reordenado a
crear-luego-sincronizar (mismo patrón `mirrorToDrive`). Reviewer re-revisó
el código corregido: sin hallazgos bloqueantes nuevos, build limpio.

### ✅ Sprint 4.3 — Recordatorios configurables (2026-07-12)

Decisión de producto ya dada: recordatorios por defecto de 3 y 5 días
antes, con preset editable ("3 y 5 días"/"5 días"/"3 días"/"1
día"/"Sin recordatorio"). Architect validó el plan con un ajuste: usar
`enum ReminderPreset` de Prisma (no `String` suelto) por consistencia con
el resto del schema, y pasar los minutos de recordatorio como parámetro
con nombre en `google-calendar.ts` en vez de posicional.

Implementado: `Tarea.reminderPreset ReminderPreset @default(DEFAULT)`
(migración aditiva `20260712010000_tarea_reminder_preset`); `google-calendar.ts`
arma `reminders.overrides` (`useDefault: false` explícito, nunca hereda el
default de la cuenta); `REMINDER_MINUTES` en `task-actions.ts` traduce
preset→minutos (DEFAULT=[4320,7200], THREE_DAYS=[4320], FIVE_DAYS=[7200],
ONE_DAY=[1440], NONE=[]); nueva Server Action `updateTaskReminderPreset`
con re-sincronización obligatoria (architect: no hay caso borde donde
re-sincronizar sea innecesario o riesgoso, `PATCH` es idempotente); select
inline en `TaskCard.tsx` con el mismo guard anti doble-submit que el input
de fecha.

**Verificado contra la API real**: tarea creada con preset DEFAULT →
`reminders.overrides` con minutos 7200 y 4320 confirmados en la API;
cambio a preset "1 día" → mismo `eventId` (PATCH, sin duplicar), overrides
actualizado a 1440 confirmado en la API. Reviewer: sin hallazgos
bloqueantes, build limpio, enums Prisma/TS alineados.

### ✅ Sprint 4.4 — Vista de agenda en el dashboard (2026-07-12)

Sin decisión de architect (sprint de UI, sin schema nuevo — reusa
`upcomingDueTasks`, ya calculado desde Sprint 9.4 para la tarjeta "Próx.
fechas límite (7d)"). Nueva sección "Agenda — Próximos 7 días" en
`app/dashboard/page.tsx`: mismas tareas que ya cuenta esa tarjeta,
renderizadas como lista ordenada por fecha ascendente, con proyecto y
enlace a `/projects/{id}`.

**Verificado en navegador con datos reales**: 4 tareas reales de "Xalma
Residencial" (calendario de publicaciones 12/14/16/18 jul 2026),
coincide exactamente con el conteo de la tarjeta ("4"), orden ascendente
confirmado, links a `/projects/{id real}` confirmados.

### ⚠️ BLOQUEADO — Sprint 4.2 (histórico, ya resuelto — dejado como
referencia del diagnóstico original)

`architect` ya dio la recomendación técnica completa para 4.2 (ver detalle
más abajo), pero señaló explícitamente una pregunta de alcance/producto que
no le corresponde decidir a él ni a mí. Se le preguntó al dueño con
`AskUserQuestion` y cerró las preguntas sin responder ("cierra hasta aquí,
no hay más tokens por 2 horas") — quedan pendientes, no se asumió nada.

**Las 2 preguntas exactas para retomar la sesión:**

1. **¿Las tareas del Inbox (sin proyecto asignado) con fecha límite
   también deben sincronizarse a Google Calendar, o solo las tareas que ya
   pertenecen a un proyecto?**
2. **¿Los eventos de Calendar deben tener hora específica (requiere
   cambiar el input de fecha actual `type="date"` a `type="datetime-local"`
   en `TaskBoard.tsx`/`ProjectTaskList.tsx`) o basta con eventos de "todo
   el día" por ahora (más simple, sin tocar la UI de fecha existente)?**

**Recomendación de architect para ambas** (no vinculante, el dueño decide):
opción 1 = "solo tareas con proyecto"; opción 2 = "todo el día por ahora,
mejora a hora específica en un sprint futuro si hace falta".

**Resto de la decisión técnica de architect, ya lista para implementar en
cuanto se resuelvan las 2 preguntas:**

- Schema: un solo campo nuevo, `Tarea.eventId String?` — mismo patrón que
  `Archivo.driveFileId`. Migración aditiva, sin backfill (33 tareas reales
  hoy, todas quedan con `eventId = null`).
- `dueDate` (`DateTime?` en Prisma) ya alcanza para fecha+hora si se elige
  la opción 2 de la pregunta 2 — el cambio sería solo en el `<input>` HTML,
  no en el schema.
- Nuevo módulo `app/lib/google-calendar.ts` (paralelo a
  `google-drive-files.ts`): `createCalendarEvent`, `updateCalendarEvent`,
  usando `getValidAccessToken()` ya probado en Sprint 4.1.
- Nueva Server Action `updateTaskDueDate` en `app/actions/task-actions.ts`
  (hoy no existe forma de cambiar `dueDate` después de crear la tarea) —
  debe seguir el patrón `taskReturnTo` ya establecido (Sprint 9.1).
  `createTask` también debe invocar el sync si viene `dueDate` al crear.
- Fallo de red hacia Calendar: degradar graceful, mismo patrón que
  `mirrorToDrive`/`mirrorFileToDrive` — la tarea se guarda igual, `eventId`
  queda `null`, nunca bloquea ni hace `redirect` a error por esto.
- Verificar con `calendars/primary/events` (no `calendarList`, ver
  lección de Sprint 4.1 arriba).

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

### 🛑 Cierre de sesión (2026-07-12, sesión larga sin supervisión — continuación)

El usuario entregó al abrir esta sesión las 2 decisiones de producto que
tenían bloqueado el Sprint 4.2 (P1: solo tareas con proyecto sincronizan a
Calendar; P2: eventos de todo el día). **Fase 4 completada entera en esta
sesión: 4.2 (sync tarea↔evento), 4.3 (recordatorios configurables), 4.4
(agenda en el dashboard)**, sumada al 4.1 ya cerrado en la sesión anterior
— la Fase 4 queda 100% completa. Cada sprint con consulta a `architect`
antes de tocar el schema, `reviewer` al cerrar (encontró 2 bugs
bloqueantes reales en 4.2 — doble-submit duplicando eventos, eventos
huérfanos al borrar un proyecto — corregidos y re-verificados contra la
API real antes de cerrar), y verificación end-to-end contra la API real de
Calendar (cuenta `eduardocortezpena@gmail.com`) en cada paso: crear,
editar fecha, completar tarea, borrar tarea, cambiar preset de
recordatorios, y borrar un proyecto con tarea sincronizada — todos los
artefactos de prueba limpiados de DB y Calendar.

Además: `BACKLOG.md` actualizado con el estado real de Hermes Agent/
Workspace (ya instalados por el dueño, integración pendiente para sesión
supervisada) — el cambio pedido en `ROADMAP.md` ("Fase 6.5", encabezado al
100% open source) NO se aplicó porque ese texto/sección no existe en el
archivo (verificado con grep); documentado como discrepancia en
`BACKLOG.md` para aclarar en la próxima sesión.

**Fase 9.5 (micro-interactividad inline, opcional) NO se tocó**: con la
Fase 4 completa (3 sprints, cada uno con reviewer + verificación real
contra Calendar) ya cubierto un volumen grande de trabajo verificado en
esta sesión, y el alcance de 9.5 es deliberadamente vago ("si sobra
presupuesto"), se prefirió cerrar aquí en verde en vez de abrir un sprint
nuevo de alcance impreciso al final de una sesión larga — mismo criterio
que ya se aplicó en sesiones anteriores (preferible verde con menos hecho
que roto a medias).

**Estado final verificado**: `git status` limpio, `npm run build` limpio,
commit único `Fase 4 completa: Sprint 4.2 (sync Calendar), 4.3
(recordatorios), 4.4 (agenda dashboard)` con los 3 sprints + fixes de
reviewer. DB sin artefactos de prueba (verificado uno por uno contra
Calendar y SQLite antes de cerrar cada sprint).

**Acciones manuales pendientes para el dueño (ninguna urgente)**:
1. Nada bloqueante de Fase 4 — completa y verificada.
2. Fase 9.5 (opcional) o cualquier fase nueva: a elección del dueño en la
   próxima sesión.
3. Integración Hermes↔EMA OS: requiere sesión CON supervisión (ver
   `BACKLOG.md`, sección Hermes).
4. Aclarar la discrepancia de `ROADMAP.md`/"Fase 6.5" anotada en
   `BACKLOG.md` — no se encontró esa sección en el archivo actual.
5. Sprint 3.5 (rclone bisync): sigue pendiente, requiere sesión supervisada
   por el riesgo de pérdida de datos ya documentado.
