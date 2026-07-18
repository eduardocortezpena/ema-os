# AGENTES.md — Borrador de diseño para los agentes de Hermes

> **Estado: BORRADOR para revisión del dueño. Nada de esto está
> configurado en Hermes ni implementado en EMA OS todavía.** Ningún
> agente descrito aquí toca el repo, la base de datos, ni Hermes en esta
> sesión — es solo el diseño a discutir antes de construir nada (Sesión
> con supervisión parcial, Parte 4, 2026-07-13).

Decisión ya tomada (ver `BACKLOG.md`, sección Hermes): **EMA OS es el
cerebro, Hermes es el canal.** La lógica de negocio (qué proyecto es cuál,
qué significa "completar", cómo se sincroniza Calendar) vive en EMA OS
como Server Actions ya existentes. Los agentes de Hermes son clientes que
invocan esas tools — nunca reimplementan la lógica por su cuenta.

---

## 1. Agente ORGANIZADOR

**Qué hace:** vigila una carpeta "inbox" local (a definir con el dueño —
candidata natural: la carpeta que el Sprint 2/Clasificador de archivos ya
tenía anotada en `BACKLOG.md`, "Medium Priority"), analiza cada archivo
nuevo que aparece ahí (PDF, Word, hojas de cálculo, imágenes) y **propone**
a qué proyecto y subcarpeta pertenece, usando las notas de contexto de los
proyectos (`Archivo.kind='NOTE'`, hoy ya no visibles en `/projects/[id]`
pero conservadas íntegras — Sesión de mejoras de UX, Parte 4) como
conocimiento de fondo para decidir.

**Regla dura, no negociable:** el agente **NUNCA borra** un archivo
original. En su fase inicial, **mueve solo tras aprobación explícita del
dueño** (propone, el dueño confirma, entonces mueve). La autonomía gradual
(mover sin preguntar para casos de alta confianza) es una decisión
posterior, explícita, no algo que el agente se auto-otorgue.

**Registro obligatorio:** cada movimiento (real o propuesto) se anota en
un log — candidato: un archivo `.jsonl` append-only en la propia carpeta
de logs del agente (Hermes ya tiene su propio directorio de logs por
perfil, `~/AppData/Local/hermes/profiles/organizador/logs/`), NUNCA en la
base de datos de EMA OS directamente sin pasar por una tool validada (ver
sección de Seguridad, principio de mínimo privilegio).

**Tools de EMA OS que necesitaría** (a construir en la Fase 6, IA/tool-use
— no existen todavía): `listar_proyectos` (lee `Proyecto` + su nota de
contexto), `proponer_destino_archivo` (solo lectura, no muta nada),
`mover_archivo_a_proyecto` (side-effect real, requiere el flag de
aprobación explícita del dueño en el payload).

**Preguntas abiertas para el dueño** (no resolver aquí, solo listarlas):
¿cuál es la carpeta "inbox" exacta? ¿Qué tan agresivo debe ser el filtro
de tipos de archivo (todo vs. solo documentos)? ¿La fase de autonomía
gradual tiene un criterio objetivo de cuándo activarse (ej. N aciertos
seguidos) o siempre requiere un cambio manual de configuración?

---

## 2. Agente COMUNICADOR

**Qué hace:** interfaz conversacional vía Telegram (ya se descartó
WhatsApp con API no oficial — ver `ROADMAP.md`, "Qué NO hacer"; WhatsApp
Business Cloud oficial queda como posibilidad futura si el dueño decide
verificar un número). Crea tareas y notas por lenguaje natural invocando
las tools de la Fase 6 (que a su vez llaman a los Server Actions ya
existentes de EMA OS — `createTask`, `createNote`, nunca lógica
duplicada).

**Regla dura:** marcar una tarea como completada **requiere confirmación**
del usuario antes de ejecutar — nunca marca a ciegas por ambigüedad de
lenguaje natural ("ya terminé X, Y, Z" debe mostrar qué tareas identificó
como coincidencia y esperar un sí/no explícito, mismo criterio ya anotado
en `BACKLOG.md`).

**Alcance adicional:** responde preguntas generales no relacionadas con
los proyectos (el agente no debe sentirse limitado a CRUD).

**Tools de EMA OS que necesitaría:** `crear_tarea` (con proyecto+fecha
opcional, dispara el mismo flujo de sync a Calendar que ya existe —
Sprint 4.2, sin reimplementar), `crear_nota`, `buscar_tareas_por_texto`
(para el matching de "ya terminé X"), `completar_tarea` (requiere el flag
de confirmación ya obtenida del usuario en el payload, mismo patrón que
`mover_archivo_a_proyecto` del Organizador).

**Preguntas abiertas para el dueño:** ¿el bot de Telegram corre 24/7 en la
misma máquina que EMA OS (recomendado, evita exponer la BD a un servidor
externo — ya anotado en `BACKLOG.md`) o en otro dispositivo? ¿Qué pasa si
llega un mensaje mientras `npm run dev` no está corriendo — se encola o se
pierde?

---

## 3. Agente de SEGURIDAD / CONFIGURACIÓN

**Qué hace:** revisa la postura de seguridad de las integraciones (tokens
guardados, permisos otorgados a cada agente, exposición de puertos —
incluyendo el acceso LAN recién abierto en la Parte 3 de esta misma
sesión) y **sugiere** hardening.

**Regla dura, la más importante de los 3 agentes:** **NO ejecuta cambios
por su cuenta.** Es de solo lectura + recomendación — nunca modifica
firewall, credenciales, ni permisos de archivos. Cualquier cambio que
sugiera lo aplica el dueño (o Claude Code en una sesión supervisada),
nunca el agente mismo. Este agente fue pedido explícitamente por el dueño
como condición para exponer cualquier cosa.

**Qué debería revisar en concreto** (lista de arranque, no exhaustiva):
- `.env` del proyecto y de cada perfil de Hermes: ¿algún secreto llegó a
  commitearse alguna vez? (verificar `git log -p -- .env` está vacío de
  contenido real, solo el `.gitignore`).
- Alcance real de los scopes OAuth de Google concedidos (ver sección de
  Seguridad más abajo) vs. lo que cada agente realmente necesita.
- Estado de la regla de firewall de Windows para el puerto 3000 (Parte 3
  de esta sesión): ¿sigue activa cuando ya no hace falta? ¿está acotada a
  la red privada (LAN) o quedó abierta a "Cualquiera"?
- Permisos de archivo del directorio `files/` y `emaos.db` — ¿son
  legibles por otros usuarios de la misma máquina?

---

## 4. Sección de SEGURIDAD del sistema completo (obligatoria)

### Credenciales que existen hoy

| Credencial | Dónde vive | Para qué |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | `.env` del proyecto (`C:\Users\EdEma\Oranizador de proyectos\ema-os\.env`), NUNCA commiteado (`.gitignore`) | Flujo OAuth de Google (Drive + Calendar) |
| `ENCRYPTION_KEY` | `.env` del proyecto | Clave AES-256-GCM para cifrar el refresh token de Google en `emaos.db` |
| Refresh token de Google (cifrado) | Tabla `GoogleDriveToken` en `emaos.db` (`refreshTokenCipher`/`refreshTokenIv`/`refreshTokenAuthTag`) | Renovar el access token sin pedir login de nuevo |
| Access token de Google (en claro, vida corta) | Misma tabla, `accessToken`/`accessTokenExpiresAt` | Llamadas directas a la API de Drive/Calendar |
| Scopes OAuth concedidos | — | `drive.file` (solo archivos creados por la app, no todo Drive) + `calendar.events` (solo eventos, no gestión de calendarios) — **acotados a propósito, no acceso total a la cuenta de Google** |
| OpenRouter API key | **No existe todavía** — Fase 5 (IA) no se ha implementado | Reservado para cuando se construya |

### Qué expone el acceso LAN (Parte 3 de esta sesión)

Abrir el puerto 3000 en el firewall de Windows para la red privada expone
`npm run dev` (sin autenticación propia — EMA OS es de un solo usuario, no
tiene login) a **cualquier dispositivo en la misma red WiFi**. Esto
incluye: la BD completa sin filtro (todas las tareas, proyectos, notas de
contexto de todos los clientes del dueño), y la posibilidad de mutar datos
(crear/borrar tareas y proyectos) desde cualquier dispositivo de la LAN.
Mitigación ya aplicada: la regla de firewall se acota a "Redes privadas"
(nunca "Cualquiera"/públicas — ver Parte 3 de `SPRINT.md`). Mitigación
pendiente si se decide acceso fuera de casa: Tailscale (anotado en
`BACKLOG.md`, Parte 3d) en vez de abrir el puerto a internet directamente.

### Qué permisos tendrá cada agente sobre archivos y BD — principio de mínimo privilegio

Ningún agente de Hermes debe tener acceso directo a `emaos.db` ni a
`app/lib/db.ts`. Todo acceso pasa por las tools de la Fase 6, que a su vez
llaman a Server Actions ya existentes y ya validados (auth de proyecto,
sanitización de `returnTo`, etc. — no se reimplementa nada de eso a nivel
de agente):

- **Organizador**: lectura de proyectos y notas de contexto (solo
  lectura). Escritura limitada a mover/copiar archivos DENTRO de
  `files/{projectId}/` — nunca fuera de esa carpeta, nunca en `emaos.db`
  directamente. Nunca borra el original hasta que exista una fase de
  autonomía explícitamente aprobada (y aun así, mover ≠ borrar — el
  original solo se retira de la carpeta inbox, no se destruye).
- **Comunicador**: escritura acotada a crear tareas/notas y completar
  tareas (con confirmación). Sin acceso a borrar proyectos, sin acceso a
  configuración (`.env`, `settings`), sin acceso a los archivos del disco
  directamente (solo vía las tools de tareas/notas).
- **Seguridad/Configuración**: solo lectura en todo el sistema. Cero
  permisos de escritura, ni siquiera a través de tools — si necesita que
  algo cambie, lo reporta, no lo ejecuta.

Cada agente corre bajo un perfil de Hermes distinto (ya existe el patrón
`hermes -p <perfil>`, ver `organizador` como perfil ya configurado) —
separación de sesión/memoria por agente, no un solo agente con todos los
permisos a la vez.

---

## 4. Agente BECARIO

> **Perfil Hermes:** `becario` (activo). Perfil `becario2` **DEPRECADO** — fusionado aquí; eliminar de Hermes cuando sea conveniente.

**Personalidad:** Eficiente, breve, sin protagonismo. Hace el trabajo y reporta. Es el más confiable y directo del equipo.

### Rol A — Documentos ofimáticos (era perfil `becario`)

**Qué hace:** Crea y edita documentos por petición del dueño (vía Dona o directo).

**Formatos:** PDF, Excel/Sheets, Word/Docs, PowerPoint/Slides, correos Gmail (cuando se autorice el scope).

**Flujo:**
1. Recibir petición (plantilla + datos, o desde cero).
2. Generar usando el stack ya disponible (`docxtemplater` para .docx, `md-to-pdf` para PDF desde Markdown) o APIs de Google Workspace.
3. Guardar en la carpeta del proyecto correspondiente.
4. Reportar a Dona con el documento generado y su ubicación.

**Regla dura:** NUNCA envía un correo sin confirmación explícita del dueño. Puede redactar borradores libremente; el envío requiere un sí explícito (mismo patrón de confirmación de 2 pasos que `completar_tarea`).

**Tools que necesita** (Fase 6, pendiente): `generar_documento`, `leer_documento`, `enviar_correo` (con flag de confirmación).

### Rol B — Congruencia de datos en EMA OS (era perfil `becario2`)

**Qué hace:** Cuando Dona ejecuta un cambio CRUD (agregar/editar/eliminar tarea o proyecto), el Becario verifica que el cambio se refleje consistentemente en todas las vistas: Dashboard, Siguientes acciones, My Day, /tasks, detalle de proyecto, Agenda, Calendario.

**Flujo:**
1. Dona delega la EJECUCIÓN y VERIFICACIÓN del cambio al Becario.
2. El Becario ejecuta vía Server Actions (nunca directo a la BD).
3. Verifica consistencia entre vistas.
4. Si detecta incongruencia, la reporta a Dona de inmediato.

**Regla dura:** Toda escritura pasa por Server Actions validadas de EMA OS — nunca escribe directo a la base de datos. Si algo no está claro, reporta la ambigüedad en vez de asumir.

**Tools que necesita** (Fase 6, pendiente): mismas tools CRUD que Comunicador + herramienta de verificación de consistencia entre vistas.

**Colabora con:** Dona (reporta a ella en ambos roles). Recibe peticiones directas del dueño si lo invoca por nombre vía Dona.

---

## Próximos pasos (no ejecutar sin decisión explícita del dueño)

1. Confirmar la carpeta "inbox" real para el Organizador.
2. Decidir si el Comunicador arranca con Telegram únicamente o también
   WhatsApp Business Cloud (oficial) desde el día uno.
3. Definir qué credencial/permiso de Hermes usa cada perfil (`organizador`
   ya existe — ¿uno por agente, o el mismo perfil con distintas tools
   habilitadas?).
4. Recién después de esto: sesión CON supervisión dedicada a implementar
   la Fase 6 (tool-use) y conectar el primer agente.
