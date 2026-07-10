---
name: project-memory
description: Cómo leer y mantener la memoria persistente de EMA OS entre sesiones (PROJECT_CONTEXT.md, PROJECT_MEMORY.md, NEXT_SESSION.md, SPRINT.md, BACKLOG.md, ROADMAP.md). Usar al empezar una sesión nueva, al planear el siguiente sprint, o al cerrar una tarea que cambia el estado real del proyecto.
---

# Project Memory — EMA OS

Archivos de memoria del proyecto (todos en la raíz o en `.claude/docs/`):

| Archivo | Para qué sirve |
|---|---|
| `PROJECT_CONTEXT.md` | Propósito, stack, MVP, estado de alto nivel |
| `PROJECT_MEMORY.md` | Decisiones tomadas y lecciones aprendidas |
| `OWNER_PROFILE.md` | Cómo prefiere trabajar el dueño del proyecto |
| `NEXT_SESSION.md` | Qué hacer al empezar la siguiente sesión |
| `.claude/docs/ROADMAP.md` | Fases del proyecto, en orden |
| `.claude/docs/SPRINT.md` | Sprint actual, backlog del sprint, DoD |
| `.claude/docs/BACKLOG.md` | Features pendientes fuera del sprint actual |
| `.claude/docs/ARCHITECTURE.md` | Descripción de las capas técnicas |

## Regla crítica: estos archivos pueden mentir

**Estos documentos describen intención, no necesariamente la realidad.**
Ya ocurrió en este proyecto: `PROJECT_CONTEXT.md` y `SPRINT.md` marcaban
como completado el CRUD de Proyectos, Tareas y Notas, y en la práctica
`app/projects/page.tsx` era un placeholder estático, `app/notes/page.tsx`
usaba solo `useState` local sin tocar la base de datos, y `npm run build`
fallaba por tres implementaciones de Prisma Client incompatibles entre sí.

Por eso, antes de construir sobre lo que dice la memoria del proyecto:
1. Verificar el estado real ejecutando (`npm run build`, `npm run dev`,
   consultando `emaos.db` directamente) — nunca asumir por lo que dice un
   `.md`.
2. Si hay contradicción entre lo documentado y lo real, la realidad gana,
   y se corrige el documento en el mismo cambio.

## Cómo mantenerla actualizada

- Al cerrar una tarea que cumple [[definition-of-done]], actualizar
  `SPRINT.md` (mover de "In Progress"/"To Do" a "Completed") y, si aplica,
  `PROJECT_MEMORY.md` con la decisión o lección nueva.
- Fechas relativas ("mañana", "el próximo sprint") se anotan como fechas
  absolutas.
- No dejar `NEXT_SESSION.md` desactualizado: debe reflejar el bloqueador
  real más reciente, no uno ya resuelto.
- Las lecciones aprendidas en `PROJECT_MEMORY.md` no se borran, se
  acumulan — son la razón de decisiones pasadas (ej. "no dejar que Claude
  llegue a >80% de contexto").

## Cómo aplicar

Al empezar una sesión: leer estos archivos en el orden de `NEXT_SESSION.md`,
pero tratar cada afirmación de estado como una hipótesis a verificar, no
como un hecho. Ver [[definition-of-done]] para qué significa "verificado".
