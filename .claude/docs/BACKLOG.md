# BACKLOG.md
## Feature Backlog

### High Priority
- [x] Connect Projects CRUD to Prisma Server Actions (Sprint 0.2)
- [x] Connect Tasks CRUD to Prisma Server Actions (Sprint 0.3)
- [x] Connect Notes CRUD to Prisma Server Actions (Sprint 0.4)
- [x] Add form validation (required fields, type checking) — hecho por CRUD conectado
- [x] Implement delete confirmation dialogs — ConfirmButton en Proyectos/Tareas/Notas
- [ ] Dashboard real statistics from database (Sprint 0.5, en curso)

### Medium Priority
- [ ] Search and filter functionality for each module
- [ ] Project progress calculation based on tasks
- [ ] Bulk actions (delete multiple items)
- [ ] Export data to JSON/CSV
- [ ] Asociar una nota a una tarea específica dentro del proyecto (Nota.taskId ya existe y es opcional desde Sprint 0.1, pero la UI no lo expone todavía — fuera de alcance de Fase 0)

### Low Priority
- [ ] Keyboard shortcuts
- [ ] Mobile-optimized sidebar (drawer)
- [ ] Drag-and-drop task reordering
- [ ] Tags/categories for projects

### Technical Debt
- [ ] Add integration tests
- [ ] Set up CI/CD pipeline
- [ ] Add ESLint custom rules
- [ ] Document component API
- [ ] Performance monitoring setup
- [ ] `app/projects/page.tsx` y `app/notes/page.tsx` reimplementan su propio wrapper (`min-h-screen bg-gray-950` + `container mx-auto p-4`) en vez de usar solo el `<main>` de `app/layout.tsx` — viola ui-guidelines ("las páginas hijas no deben reimplementar su propio wrapper de layout"). Hallazgo del reviewer en Sprint 0.4, no bloqueante, pendiente de limpieza (candidato: Sprint 1.5 o 7.2).
- [x] `app/dashboard/page.tsx` tema claro — corregido en Sprint 0.5.
- [ ] Borrar un Proyecto con Tareas/Notas asociadas falla por restricción de FK (mensaje genérico, hay que borrar hijos primero manualmente). Considerar `onDelete: Cascade` en el schema o un mensaje explícito guiando al usuario. Detectado en Sprint 1.1, preexistente desde Sprint 0.2.

### Known Issues
- Ninguno bloqueante actualmente. Ver Technical Debt para deuda no bloqueante conocida.

### Descartado (contradice decisiones ya tomadas)
- ~~Dark/light theme toggle~~ — la app es dark-only por decisión de diseño (ver skill `ui-guidelines`), no se agrega toggle de tema.
