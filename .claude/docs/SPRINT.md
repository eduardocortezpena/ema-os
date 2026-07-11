# SPRINT.md
## Current Sprint: Fase 1 — Núcleo de priorización "¿qué hago ahora?"

### Sprint Goal
Dar a EMA OS mecanismos reales de priorización: Next Action por
proyecto, vista consolidada, prioridad manual, y vista "My Day".

### Sprint Duration
Start: 2026-07-11

### Sprint Backlog

#### Completed
- [x] Fase 0 completa (MVP: Dashboard/Proyectos/Tareas/Notas conectados)
- [x] PASO 0: singleton Prisma verificado en navegador (banner de error
      real probado con doble-borrado; se encontró y corrigió que exponía
      el volcado crudo de Prisma/Turbopack — ahora usa `app/lib/errors.ts`)
- [x] Sprint 1.1: Next Action por proyecto (`Proyecto.nextActionTaskId`,
      decisión de `architect`, migración aplicada, UI en projects/page.tsx,
      validación de integridad taskId↔projectId añadida tras hallazgo de
      `reviewer`). Verificado en navegador de extremo a extremo.

#### To Do (siguiente en orden, ROADMAP.md Fase 1)
- [ ] Sprint 1.2: Vista consolidada de Next Actions en el dashboard
- [ ] Sprint 1.3: Prioridad P0-P3 en Task (migración) + ordenamiento
- [ ] Sprint 1.4: Vista "My Day" (plannedForToday + rollover manual)
- [ ] Sprint 1.5 (OPCIONAL): orden sugerido automático — solo si hay
      presupuesto holgado

### Definition of Done
Reference: .claude/skills/definition-of-done/SKILL.md

### Blockers
- Ninguno.

### Notas técnicas para la próxima sesión
- Tras CUALQUIER migración de Prisma: correr `npx prisma generate` Y
  reiniciar el servidor de `npm run dev` (Turbopack cachea el cliente
  viejo en memoria — causó un `PrismaClientValidationError` falso
  positivo en Sprint 1.1 hasta reiniciar).
- `app/lib/db.ts` (fuera de `app/lib/prisma/`, el directorio de output)
  sigue siendo el único singleton correcto a importar.
- Deuda conocida no bloqueante (ver BACKLOG.md Technical Debt): borrar un
  Proyecto con Tareas/Notas asociadas falla por restricción de FK — hay
  que borrar los hijos primero o decidir `onDelete: Cascade`.

### Daily Notes
2026-07-10: Fase 0 (MVP) completada y verificada en sesión anterior.
2026-07-11: PASO 0 (arranque) + Sprint 1.1 completados y verificados en
ejecución real. Se paró aquí por presupuesto de tokens, en verde
(build limpio, commit hecho) — Sprints 1.2-1.5 quedan para la próxima
sesión, en ese orden.
