# MCP_SERVER.md — Servidor MCP de EMA OS

> **Qué es:** documentación del servidor MCP local (`mcp-server/index.ts`) y sus tools.
> **Para qué:** que cualquier agente externo sepa qué tools existen y cómo arrancarlas.
> **Quién actualiza / cuándo:** quien agrega/cambia una tool MCP, en el mismo commit.
> **Conecta con:** `.claude/docs/MCP_HERMES.md` (guía de conexión desde Hermes).
> **Si falta:** un agente externo no sabe qué tools existen ni el patrón de confirmación de 2 pasos.

Servidor MCP (Model Context Protocol) local que expone las herramientas de
EMA OS a agentes externos (Hermes, Claude Code, otros) vía stdio. Permite
listar/crear proyectos y tareas, leer Next Actions y My Day, gestionar
plantillas y generar documentos DOCX y PDF — sin pasar por la UI.

## Arranque

    npm run mcp

Requiere **Node >= 22.6** (type stripping nativo). Usa el loader
`mcp-server/loader.mjs` para resolver el cliente Prisma generado (imports TS
sin extensión, pensados para bundler) en Node puro. Lee `DATABASE_URL` de `.env`.

## Herramientas (14)

**Lectura** (ejecutan directo): `listar_proyectos` (filtros estado/prioridad),
`listar_tareas` (filtros proyecto/estado/prioridad), `buscar_tareas_por_texto`,
`leer_nota_contexto`, `leer_next_actions`, `leer_my_day`, `listar_plantillas`.

**Escritura** (2 pasos — devuelven `confirmationId`, se ejecutan vía
`confirmar_accion`): `crear_tarea`, `actualizar_estado_tarea` (TODO/DONE...),
`eliminar_tarea`, `crear_nota`, `mover_archivo_a_proyecto`, `generar_documento`
(DOCX y PDF desde plantilla Markdown).

El patrón de 2 pasos evita escrituras accidentales: el agente propone, y la
acción solo se ejecuta en una segunda llamada con el `confirmationId`.

## Conexión

### Claude Code

Añade a `.mcp.json` (raíz del proyecto) o a `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "ema-os": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "C:/Users/EdEma/Oranizador de proyectos/ema-os"
    }
  }
}
```

Reinicia Claude Code; las tools aparecen como `mcp__ema-os__<tool>`.

### Hermes

El runtime de Hermes no soporta el campo `cwd`; usa `npm --prefix <ruta> run
mcp`. Guía completa y troubleshooting en `.claude/docs/MCP_HERMES.md`:

```json
{
  "mcpServers": {
    "ema-os": {
      "command": "npm",
      "args": ["--prefix", "C:/Users/EdEma/Oranizador de proyectos/ema-os", "run", "mcp"]
    }
  }
}
```

`--prefix` es obligatorio (el servidor resuelve `emaos.db`, `templates/` y
`files/` relativos al repo). Probado: `npm run test:mcp` invoca las 14 tools
end-to-end.

## Limitaciones

- **Sin Google Calendar**: las tareas creadas/actualizadas vía MCP NO
  sincronizan eventos de Calendar (esa lógica vive acoplada al request context
  de Next). La UI web sigue sincronizando normalmente.
- **PDF necesita Chrome**: la variante PDF de `generar_documento` usa
  `md-to-pdf` (puppeteer). Reutiliza el Chrome de Playwright si está instalado,
  o `PUPPETEER_EXECUTABLE_PATH`. Sin Chrome, la generación PDF falla con error
  claro (la DOCX no se ve afectada).
- **Confirmaciones en memoria**: cada proceso MCP tiene su propio mapa de
  confirmaciones (TTL 5 min, máx 50 pendientes). No persisten entre reinicios.
