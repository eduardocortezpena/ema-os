# MEMORIA_SESIONES.md — EMA OS

> Registro consolidado por jornada. Compacto a propósito (regla de tope de líneas).
> Al superar ~100 líneas, rotar entradas viejas a `archive/MEMORIA_SESIONES_HISTORICO.md` (copia ciega).

---

## 2026-07-19 — Fase 5 UI + Fase 6 MCP + purga de seguridad + reglas anti-tokens

**Proyecto tocado:** EMA OS (repo `ema-os`).

**Qué se logró (por agente):**
- **Hermes Señor Dev** — falló la tarea de UI de documentos (rama `senior-dev/fase-5-ui` quedó vacía de código real). Retirado de tareas de programación desde entonces; sigue en Organizador/Becario/Dona.
- **Z Code (GLM 5.2)** — construyó la UI de documentos: `/templates` (CRUD), `GenerateDocumentForm` por tarea, `deleteDocumentTemplate`. Rama `zcode/fase-5-ui-documentos`. También cerró el "refactor Prisma en vuelo" (era la regeneración del cliente que `main` necesitaba; `main` no compilaba sin él).
- **Claude Code (modo Claude)** — auditó y mergeó el trabajo de Z Code; ejecutó la cirugía de git; hizo los 3 merges finales; documentó la config de plugins globales.
- **Claude Code (modo GLM 5.2)** — Fase 6 MCP: servidor operativo con 13 tools (7 lectura + 5 escritura con confirmación de 2 pasos + `confirmar_accion`). Luego hardening: reparó bug de PDF, suite `npm run test:mcp` (24/24), casos borde, config de Hermes. Ramas `glm/fase-6-mcp-server` y `glm/fase-6-hardening`.

**Decisiones clave:**
- **Arnés = Claude Code; cerebro = GLM 5.2.** Misma potencia, mejor disciplina (skills, checklist, subagentes). Z Code queda de respaldo cuando se agota la sesión de GLM.
- **Bug de PDF (raíz):** no era puppeteer, era el bundling de Next. Fix: `serverExternalPackages: ["md-to-pdf","puppeteer"]` en `next.config.ts` + motor centralizado en `app/lib/documents.ts`.
- **Sistema anti-tokens:** archivos vivos con tope de 100 líneas; lo viejo rota a `.claude/docs/archive/` (copia ciega, prohibido leer sin orden). Archivos vivos: BACKLOG, SPRINT, ROADMAP, BITACORA, CONTEXTO_PROYECTOS. `SPRINT.md` bajó de 1310 a 48 líneas.
- **Regla nueva en CLAUDE.md:** una tarea de alcance cerrado por sesión; referenciar lecturas previas, no releer.
- **Origen del derroche de tokens de GLM:** plugins GLOBALES de Claude Code (~38 agents / 207 skills a nivel cuenta, no del repo — el repo solo tiene 4 agents y 5 skills). ~15k tokens de overhead por turno en toda sesión de terminal. Pendiente: dieta de plugins globales.

**Seguridad (resuelto):**
- Google OAuth token en claro estaba en `emaos.db` en commits históricos (`395586bd`, `f3ce3401`, `0e4004cd`, `1fe8b92c`).
- Dueño rotó el secreto de cliente OAuth en Google Cloud + revocó acceso de terceros + borró el secreto viejo y el `client_secret*.json` suelto.
- `git filter-repo --path emaos.db --invert-paths` purgó el archivo de toda la historia (backup previo en `ema-os-backup-2026-07-19`). Verificado: 0 commits con `emaos.db`, 0 coincidencias de `ya29.`.
- `emaos.db` desindexado, `*.db` en `.gitignore`.

**Estado final del repo:** `main` + `glm/fase-6-mcp-server` + `glm/fase-6-hardening` + `zcode/fase-5-ui-documentos` pusheados a GitHub sin bloqueo. Build limpio, 24/24 tests.

**Limitaciones documentadas:** sync de Google Calendar vía MCP no implementado (lógica acoplada al request de Next); warning `docxtemplater .setData` deprecado (no regresión, DOCX funciona).

**Pendiente / lo siguiente:**
1. Dieta de plugins globales de Claude Code (reducir overhead de ~15k tokens/turno).
2. Conectar y probar el MCP server con Hermes en sesión supervisada (`MCP_HERMES.md` ya listo con las 13 tools).
3. Fase 6 real: que los agentes operen EMA OS a través del MCP en flujo normal.
4. **Marketing Xalma (prioridad #1 de negocio):** arrancar con Google AI Pro (Nano Banana / Imagen para Post 1, luego Veo 3). Recalibrar tono de Publicación 1 (sereno, poco texto). No publicar precios hasta confirmar con Yimer.
5. Antigravity en banca hasta que haya tarea de UI aislada (landing / página de Facebook Xalma o Fase 9).
