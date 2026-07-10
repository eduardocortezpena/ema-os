# SPRINT.md
## Current Sprint: Fase 0 — Terminar el MVP (ROADMAP.md)

### Sprint Goal
Completar el MVP funcional de EMA OS con las 4 entidades (Dashboard,
Proyectos, Tareas, Notas) conectadas de verdad a la base de datos,
verificado en ejecución.

### Sprint Duration
Start: 2026-07-08
End: 2026-07-10

### Sprint Backlog

#### Completed
- [x] Project initialization (Next.js, TypeScript, Tailwind)
- [x] Prisma + SQLite configuration
- [x] Layout with sidebar navigation
- [x] Build reparado (singleton único de Prisma, clientes obsoletos eliminados)
- [x] Sprint 0.1: Schema consolidado (Nota pertenece a Proyecto), migración aplicada
- [x] Sprint 0.2: Proyectos conectado a la BD real (CRUD verificado en navegador)
- [x] Sprint 0.3: Tareas conectado a la BD real (CRUD + cambio de status verificado)
- [x] Sprint 0.4: Notas conectado a la BD real (CRUD verificado)
- [x] Sprint 0.5: Dashboard con datos reales, "/" redirige a "/dashboard"
- [x] Form validation (required fields, progress clamp 0-100)
- [x] Delete confirmations (ConfirmButton en las 3 entidades)
- [x] Dashboard statistics from DB (conteo de proyectos/tareas reales)
- [x] Verify build passes (`npm run build` limpio en cada sprint)

#### To Do (fuera de alcance de Fase 0, ver BACKLOG.md)
- [ ] Search and filter functionality
- [ ] Fase 2 en adelante: Notas Markdown+Drive, Calendar, IA, documentos, UX avanzada

### Definition of Done
Reference: .claude/skills/definition-of-done/SKILL.md

### Blockers
- Ninguno actualmente.

### Deuda conocida (no bloqueante, ver BACKLOG.md)
- `app/tasks/page.tsx` tenía texto de UI en inglés inconsistente con el resto de páginas en español — corregido en Sprint 0.5.
- `revalidatePath('/projects/${projectId}')` en task-actions.ts apuntaba a una ruta que no existe — código muerto, eliminado en Sprint 0.5.
- El singleton de Prisma (`app/lib/prisma/index.ts`) vive dentro del directorio de output del generador (`prisma/schema.prisma` output), lo que lo hace vulnerable a ser sobreescrito por `npx prisma generate`. Pendiente de revisión por `architect` antes de la Fase 1.
- Errores de Server Actions solo van a `console.error`, sin feedback visible al usuario en la UI. Aceptable para MVP, revisar en Fase 1.

### Daily Notes
2026-07-08: Infrastructure setup completado.
2026-07-10: Build reparado. Fase 0 (Sprints 0.1-0.5) completada y verificada
en ejecución real (npm run dev + navegador + consulta directa a emaos.db)
para las 5 tareas. MVP funcionalmente completo.
