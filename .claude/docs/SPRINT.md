# SPRINT.md
## Estado actual: Fase 6 ✅ completa + endurecida | MCP operativo (13 tools, PDF, tests)

### Sprint activo (2026-07-18)

Cambios en vuelo (ver `git status`):
- `app/lib/prisma/` — refactor interno del cliente Prisma (browser, client,
  class, models, namespaces). Modelo `DocumentTemplate` nuevo.
- `app/lib/prisma/models/DocumentTemplate.ts` — archivo sin trackear (??).

Acción inmediata al retomar:
1. Correr `npm run build` — confirmar que compila.
2. Si hay migración nueva: `npx prisma generate` + reiniciar `npm run dev`.
3. Registrar entrada en `BITACORA.md` al cerrar.

### Próximo paso para el dueño

Conectar Hermes al servidor MCP local siguiendo
`.claude/docs/MCP_HERMES.md`. Sin eso, Fase 6.5 (integración Hermes↔EMA OS)
no puede arrancar. **Requiere sesión CON supervisión.**

### Resumen de fases

| Fase | Estado |
|------|--------|
| 0 — MVP | ✅ completa |
| 1 — Priorización | ✅ completa |
| 2 — Reservada | sin sprints |
| 3 — Google Drive (3.1-3.4) | ✅ completa; 3.5 rclone bisync OPCIONAL |
| 4 — Google Calendar (4.1-4.4) | ✅ completa |
| 5 — IA / OpenRouter | ✅ completa (Fase 6 real según ROADMAP) |
| 6 — Documentos automáticos | ✅ completa (Sprint 6.1-6.5) |
| 7 — UX avanzada (7.1-7.4) | ✅ completa |
| 9 — Interactividad (9.1-9.4) | ✅ completa; 9.5 opcional |
| 10 — Estilización | abierta, sin sprints |

### Notas técnicas críticas

- Tras cualquier migración Prisma: `npx prisma generate` + `taskkill` del
  proceso `npm run dev` (no solo reload — Turbopack cachea el cliente viejo).
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `ENCRYPTION_KEY`
  en `.env` local, nunca en git.
- `app/lib/google-drive-auth.ts::getValidAccessToken` = punto de entrada
  para cualquier llamada a Drive o Calendar. No reimplementar.

### Historial completo

Ver `.claude/docs/archive/SPRINT_HISTORICO.md`.
