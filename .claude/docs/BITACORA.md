# BITACORA.md — Acciones por agente

Formato: `fecha | agente | acción | resultado`

---

2026-07-18 | Claude Code | Rotación de documentos de contexto (SPRINT.md 1310→38 líneas, BACKLOG.md 164→65 líneas, ROADMAP.md 407→51 líneas). Históricos en `.claude/docs/archive/`. Creación de BITACORA.md y reglas de rotación en CLAUDE.md. | Build pendiente de verificar.

2026-07-18 | Z Code | Fase 5/6 UI — página `/templates` (CRUD completo: alta/listado/borrado de plantillas .docx y .md con `deleteDocumentTemplate` nueva + `registerDocumentTemplate` ahora respeta `returnTo`) + botón "Generar documento" por tarea en `/projects/[id]` (nuevo componente `GenerateDocumentForm`, integrado vía `ProjectTaskList`). Formulario de plantillas migrado de `/settings` a `/templates`; `/settings` ahora solo enlaza. Nav lateral con "Templates". | Build limpio. CRUD y flujo de generación (MD→PDF + DOCX, con y sin completar tarea) verificados end-to-end. Rama `zcode/fase-5-ui-documentos`. **Bloqueo encontrado y resuelto con autorización del dueño:** migración `20260718013940_add_document_templates` no estaba aplicada (P2021) — se corrió `npx prisma migrate deploy`. Reportado al dueño: `emaos.db` (BD con datos) está trackeada en git y fuera de `.gitignore` (problema preexistente, no tocado). Refactor Prisma "en vuelo" en `app/lib/prisma/*` (trabajo ajeno) se dejó fuera del commit.

2026-07-18 | Claude Code | Auditoría e integración Fase 5/6 UI documentos. Verificado: (1) commit 7d9a05a toca exactamente los 8 archivos reportados, ninguno ajeno; (2) build limpio en rama; (3) /templates CRUD funciona end-to-end (crear→listar→borrar); (4) GenerateDocumentForm renderiza en /projects/[id] con accordion; (5) error de PDF (puppeteer) es preexistente en main — no introducido por Z Code, error handling correcto (tarea no cambia de estado); (6) merge zcode/fase-5-ui-documentos → main exitoso (commit ort strategy); (7) build limpio en main post-merge; (8) higiene: emaos.db desindexado + *.db en .gitignore; (9) backup-db.ps1 restaurado (borrado del working tree por error, mergeado en main desde 173d50b). Refactor Prisma en vuelo (app/lib/prisma/*) documentado y no tocado. | OK — main en verde.

---
> Al superar 100 líneas: rotar entradas viejas a `.claude/docs/archive/BITACORA_HISTORICO.md`
> (append al final, copia ciega sin resumir).
> Todo agente que cierre una tarea DEBE agregar su entrada aquí antes de hacer commit.
