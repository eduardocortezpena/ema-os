---
name: project-memory
description: Cómo leer y mantener la memoria persistente de EMA OS entre sesiones (CLAUDE.md, SPRINT.md, BACKLOG.md, ROADMAP.md, AGENTES.md). Usar al empezar una sesión nueva, al planear el siguiente sprint, o al cerrar una tarea que cambia el estado real del proyecto.
---

# Project Memory — EMA OS

## Los 5 documentos vivos (única fuente de verdad)

| Archivo | Para qué sirve |
|---|---|
| `CLAUDE.md` | Reglas permanentes, checklist de inicio de sesión |
| `.claude/docs/SPRINT.md` | Sprint actual, estado vivo, cierre de sesiones |
| `.claude/docs/BACKLOG.md` | Deuda técnica e ideas futuras |
| `.claude/docs/ROADMAP.md` | Fases del proyecto, en orden |
| `.claude/docs/AGENTES.md` | Diseño de los agentes de Hermes |

Ver también `.claude/docs/ARCHITECTURE.md` (capas técnicas, actualizar
aparte, no forma parte de los 5 vivos) y `MASTER_CONTEXT.md` (raíz del
repo — resumen generado A PARTIR de los 5 vivos, nunca editado a mano;
ver "Arquitectura de memoria" en `CLAUDE.md`).

`PROJECT_CONTEXT.md`, `PROJECT_MEMORY.md`, `OWNER_PROFILE.md` y
`NEXT_SESSION.md` fueron **archivados** en `.claude/docs/archive/`
(2026-07-17, sesión de auditoría de memoria) — su contenido relevante ya
está cubierto por los 5 documentos vivos. No son fuente de verdad activa;
consultarlos solo con contexto histórico explícito en mente.

## Regla crítica: estos archivos pueden mentir

**Estos documentos describen intención, no necesariamente la realidad.**
Ya ocurrió en este proyecto: docs marcaban como completado el CRUD de
Proyectos, Tareas y Notas, y en la práctica eran placeholders sin tocar
la base de datos, y `npm run build` fallaba.

Por eso, antes de construir sobre lo que dice la memoria del proyecto:
1. Verificar el estado real ejecutando (`npm run build`, `npm run dev`,
   consultando `emaos.db` directamente) — nunca asumir por lo que dice un
   `.md`.
2. Si hay contradicción entre lo documentado y lo real, la realidad gana,
   y se corrige el documento en el mismo cambio.

## Cómo mantenerla actualizada

- Al cerrar una tarea que cumple [[definition-of-done]], actualizar
  `SPRINT.md` y, si aplica, `BACKLOG.md`/`ROADMAP.md`.
- Fechas relativas ("mañana", "el próximo sprint") se anotan como fechas
  absolutas.
- Regenerar `MASTER_CONTEXT.md` cuando cambie algo sustancial (nueva fase
  completada, cambio de prioridades, nuevos agentes) — nunca editarlo a
  mano.

## Cómo aplicar

Al empezar una sesión: leer `SPRINT.md` y `BACKLOG.md` primero (checklist
de `CLAUDE.md`), tratando cada afirmación de estado como una hipótesis a
verificar, no como un hecho. Ver [[definition-of-done]] para qué significa
"verificado".
