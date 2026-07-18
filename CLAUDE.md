@AGENTS.md

# Goal Permanente

Construir EMA OS como un sistema operativo personal para la gestión de proyectos.

Prioridades:

1. MVP funcional.
2. Simplicidad.
3. Estabilidad.
4. Código limpio.
5. Verificar siempre antes de continuar.

Reglas:

- Nunca agregar funcionalidades no solicitadas.
- Nunca detener el desarrollo por decisiones menores.
- Nunca marcar una tarea como terminada sin cumplir la Definition of Done.

## Checklist de inicio de sesión

Se aplica SIEMPRE al empezar cualquier sesión nueva de trabajo en este
proyecto, sin que el usuario tenga que pedirlo:

1. Leer `.claude/docs/SPRINT.md` y `.claude/docs/BACKLOG.md` para retomar
   el estado exacto donde quedó la sesión anterior.
2. Confirmar `git status` limpio (sin cambios sin commitear) antes de
   empezar a programar.
3. Correr `npm run build` y confirmar que compila limpio desde la sesión
   anterior. Si algo se rompió, arreglarlo antes de seguir con cualquier
   feature nueva.
4. Si hubo una migración de Prisma en la sesión anterior (revisar en
   `SPRINT.md`): correr `npx prisma generate`, verificar que
   `app/lib/db.ts` sigue intacto, y reiniciar `npm run dev` (Turbopack
   cachea el cliente viejo en memoria y provoca falsos errores si no se
   reinicia).
5. Confirmar que `.claude/skills/` y `.claude/agents/` siguen activos sin
   conflictos (nombres duplicados, frontmatter inválido) — solo si hubo
   cambios recientes en esa carpeta.

## Reglas permanentes de verificación

- Toda funcionalidad se prueba en navegador real (`npm run dev`), no solo
  con `npm run build`. El build limpio no es evidencia de que algo
  funciona, solo de que compila.
- El navegador de pruebas de este entorno tiene timing errático con
  clicks en formularios; cuando falle, usar manipulación de DOM vía JS y
  verificar el resultado contra la base de datos directamente.
- No decir "listo" o "completado" sin mostrar el comando ejecutado y su
  output como evidencia.
- Usar el subagente `reviewer` al cerrar cada sprint, y que corra el
  build por su cuenta en vez de confiar en el resumen del sprint.
- Administrar el presupuesto de tokens de la sesión: si el límite se
  acerca, cerrar el sprint en curso en verde (build limpio + commit +
  `SPRINT.md` actualizado) y parar, en vez de dejar un sprint a medias.

## Mapa de fases

Fuente de verdad: `.claude/docs/ROADMAP.md`. Numeración renumerada dos
veces (2026-07-11): primero para fijar Fase 0=MVP/Fase 1=Priorización,
después para reservar la Fase 2 y mover Drive a Fase 3. Esto ya causó
confusión entre sesiones más de una vez — ante cualquier duda, confirmar
el número de fase contra `ROADMAP.md`, nunca asumirlo del prompt del
usuario.

- **Fase 0** — Cerrar el MVP existente ✅ completa
- **Fase 1** — Núcleo de priorización "¿qué hago ahora?" ✅ completa
  (incluye Next Action por proyecto y vista "My Day"; Sprint 1.5 —orden
  sugerido automático— opcional, pendiente)
- **Fase 2** — Reservada, sin sprints planificados (candidata:
  "Clasificador de archivos", ver `BACKLOG.md`)
- **Fase 3** — Google Drive: archivos y notas Markdown editables desde
  la web
- **Fase 4** — Google Calendar como pilar
- **Fase 5** — IA con OpenRouter (BYOK)
- **Fase 6** — Documentos automáticos
- **Fase 7** — UX avanzada
- **Fase 8** — Endurecimiento y pulido final

## Arquitectura de memoria

(Documentado 2026-07-17, sesión de auditoría de memoria — regla, no
ejecución: no dispara ninguna acción por sí sola.)

- **5 documentos vivos, única fuente de verdad**: `CLAUDE.md`,
  `.claude/docs/SPRINT.md`, `.claude/docs/BACKLOG.md`,
  `.claude/docs/ROADMAP.md`, `.claude/docs/AGENTES.md`. Se actualizan en
  cada sesión relevante, en el mismo cambio que cierra el trabajo — no
  después.
- **`MASTER_CONTEXT.md`** (raíz del repo) se genera SIEMPRE a partir de
  los 5 vivos, nunca se edita a mano directamente. Se regenera cuando
  cambia algo sustancial: una fase completada, un cambio de prioridades,
  o agentes nuevos/modificados en `AGENTES.md`. Verificar su fecha/
  contenido contra el estado real antes de decidir si hace falta
  regenerarlo — no regenerar por rutina si nada sustancial cambió.
- **Ningún agente de Hermes recibe los 5 documentos fuente
  directamente** — solo `MASTER_CONTEXT.md`. Evita que cada agente tenga
  su propia versión de "la verdad" del proyecto.
- **Cualquier archivo `.md` de contexto fuera de esta lista de 5 es
  sospechoso por defecto**: auditar su contenido contra los 5 vivos antes
  de confiar en él o de citarlo desde una skill/otro doc. Ver
  `.claude/docs/archive/` para precedente (4 docs legado archivados en
  esta misma sesión, con hallazgos de contenido no migrado reportados al
  dueño antes de archivar).

## Modelos de OpenRouter

Cadena por defecto para **Dona y todos los agentes salvo Señor Dev**:
1. `nvidia/nemotron-3-super:free`
2. `nvidia/nemotron-3-ultra:free`
3. `meta-llama/llama-3.3-70b-instruct:free`

Cadena para **Señor Dev** (especializada en código):
1. `poolside/laguna-m.1:free` — expira ~28 jul 2026
2. `poolside/laguna-xs-2.1:free`
3. `cohere/north-mini-code:free`
4. `nvidia/nemotron-3-super:free`

**Regla**: toda la cadena debe ser `:free` — imposible consumir créditos
por accidente. Cuando un modelo `:free` se retira, su ID deja de existir
y la cadena cae sola; sin job programado ni mantenimiento manual.

El modelo del `/assistant` interno (`nvidia/nemotron-nano-9b-v2:free`,
fijado en Sprint 6.3) se mantiene si funciona bien. Candidato de upgrade:
`nvidia/nemotron-3-super:free` — evaluar con una prueba de tool-calling
antes de cambiar.

## Reglas para trabajadores externos (Antigravity / Señor Dev)

Estas reglas aplican a cualquier agente externo que trabaje en una rama
paralela a main. Origen: incidente 2026-07-18 donde Antigravity instaló
`@modelcontextprotocol/sdk` en `package.json` raíz sin que se le pidiera.

**Archivos prohibidos (nunca tocar sin autorización explícita):**
- `package.json` y `package-lock.json` (raíz del proyecto)
- `.env` y `.env.example`
- `prisma/schema.prisma` y archivos de migración
- `main` — nunca pushear directo a main; solo el integrador mergea

**Regla de alcance:** una rama, una tarea. Si se asignó "añadir componentes
UI", el commit toca solo los componentes UI — nada más.

**Regla de bloqueo:** si el build falla por trabajo ajeno en vuelo (otra
rama, dependencia no instalada, etc.), el trabajador **reporta el bloqueo
y para**. Nunca "arregla" el bloqueo instalando cosas o modificando
archivos fuera de su scope. El integrador desbloquea o reordena.

**Proceso de merge:** el integrador (Claude en sesión de revisión) revisa
el diff completo, hace cherry-pick selectivo si el commit mezcla cambios
legítimos con violaciones, y documenta qué se excluyó y por qué en el
mensaje de commit.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
