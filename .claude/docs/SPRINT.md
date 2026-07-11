# SPRINT.md
## Current Sprint: Fase 1 — Núcleo de priorización "¿qué hago ahora?" (COMPLETA)

### Sprint Goal
Dar a EMA OS mecanismos reales de priorización: Next Action por
proyecto, vista consolidada, prioridad manual, y vista "My Day".

### Sprint Duration
Start: 2026-07-11 · End: 2026-07-11

### Sprint Backlog

#### Completed
- [x] Fase 0 completa (MVP: Dashboard/Proyectos/Tareas/Notas conectados)
- [x] PASO 0 (sesión anterior): singleton Prisma verificado, banner de
      error saneado (`app/lib/errors.ts`)
- [x] Sprint 1.1: Next Action por proyecto (`Proyecto.nextActionTaskId`,
      validación de integridad taskId↔projectId)
- [x] Sprint 1.2: Vista consolidada de Next Actions en el dashboard
      (sección "Siguientes acciones")
- [x] Sprint 1.3: Prioridad editable + ordenamiento (`app/lib/sort.ts`,
      sin migración — decisión de architect de reusar `Tarea.priority`
      existente en vez de duplicar con un campo P0-P3 nuevo)
- [x] Sprint 1.4: Vista "My Day" (`Tarea.plannedFor`, rollover manual,
      página `/my-day` nueva, link en sidebar)

#### To Do (siguiente, ver ROADMAP.md)
- [ ] Sprint 1.5 (OPCIONAL, ver BACKLOG.md Medium Priority): orden
      sugerido automático — pospuesto por presupuesto de tokens
- [ ] Fase 2 del ROADMAP: Notas Markdown + Google Drive — **NO empezar
      sin confirmación explícita del usuario** (regla de la sesión:
      "para y avísame antes de pasar a la Fase 2")

### Definition of Done
Reference: .claude/skills/definition-of-done/SKILL.md

### Blockers
- Ninguno.

### Notas técnicas para la próxima sesión
- Tras CUALQUIER migración de Prisma: `npx prisma generate` Y reiniciar
  `npm run dev` (Turbopack cachea el cliente viejo). Verificar siempre
  que `app/lib/db.ts` sobrevive.
- `app/lib/sort.ts` (`byPriorityAndDueDate`) y `app/lib/date.ts`
  (`startOfDay`) son los módulos compartidos de ordenamiento/fecha —
  reusar, no duplicar, si Fase 2+ necesita algo similar.
- El entorno de automatización del navegador de esta sesión tuvo
  problemas recurrentes de timing (clicks/selectores que agarraban el
  formulario equivocado tras navegar) — la técnica que funcionó de forma
  confiable fue manipular el DOM/formularios vía `javascript_tool`
  (`requestSubmit()`, setters nativos + eventos `input`/`change`) en vez
  de clicks por coordenadas, y verificar resultados consultando
  `emaos.db` directamente con `better-sqlite3` cuando el DOM no era
  confiable.

### Deuda conocida no bloqueante (ver BACKLOG.md Technical Debt)
- Borrar un Proyecto con Tareas/Notas asociadas falla por FK (desde
  Sprint 0.2).
- `startOfDay` usa timezone del servidor, no documentado como asunción
  (desde Sprint 1.4).
- `app/projects/page.tsx` y `app/notes/page.tsx` reimplementan su propio
  wrapper de layout (desde Sprint 0.4).

### Daily Notes
2026-07-10: Fase 0 (MVP) completada.
2026-07-11 (sesión anterior): PASO 0 + Sprint 1.1 completados.
2026-07-11 (esta sesión): Sprints 1.2, 1.3 y 1.4 completados y
verificados en ejecución real cada uno (navegador + consulta directa a
la BD). Fase 1 del ROADMAP queda completa. Parado aquí explícitamente
antes de Fase 2, según instrucción del usuario.
