# SPRINT.md

> **Qué es:** foto del sprint en curso — qué se hizo, qué falta, en qué rama.
> **Para qué:** retomar exactamente donde quedó la sesión anterior sin releer commits.
> **Quién actualiza / cuándo:** el agente que cierra trabajo, en el mismo commit que lo cierra.
> **Conecta con:** `BACKLOG.md` (de donde salen los ítems), `ROADMAP.md` (fase actual), `BITACORA.md` (detalle de cada acción).
> **Si falta:** la próxima sesión repite exploración ya hecha o retoma trabajo a medias sin saber el estado real.

## Estado actual: Fase 6 ✅ completa + endurecida | MCP operativo (14 tools, PDF, tests)

### Sprint activo (2026-07-19)

- **Rama `claude/mcp-gaps`** — gaps post-integración Hermes-MCP: merge PR #1,
  tool `eliminar_tarea` (2 pasos), docs Hermes corregidas (`--prefix` en vez
  de `cwd`), `TELEGRAM_HOME_CHANNEL=<PENDIENTE>` en perfil `organizador`.
  Build limpio + `npm run test:mcp` 30/30. Commit local, sin push.

Cambios cerrados (2026-07-18): refactor Prisma y Fase 6 MCP ya en main.

### Próximo paso para el dueño

1. Pegar el `chat_id` real de Telegram en
   `~/AppData/Local/hermes/profiles/organizador/.env`, reemplazando
   `<PENDIENTE>` en la línea `TELEGRAM_HOME_CHANNEL=`.
2. Conectar Hermes al servidor MCP local siguiendo
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
