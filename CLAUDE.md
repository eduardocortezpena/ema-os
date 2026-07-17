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
