# MCP_SERVER.md — Servidor MCP de EMA OS

Servidor MCP (Model Context Protocol) local que expone las herramientas de
EMA OS a agentes externos (Hermes, Claude Code, otros) vía stdio. Permite
listar/crear proyectos y tareas, leer Next Actions y My Day, gestionar
plantillas y generar documentos DOCX — sin pasar por la UI.

## Arranque

    npm run mcp

Requiere **Node >= 22.6** (type stripping nativo). Usa el loader
`mcp-server/loader.mjs` para resolver el cliente Prisma generado (imports TS
sin extensión, pensados para bundler) en Node puro. Lee `DATABASE_URL` de `.env`.

## Herramientas (13)

**Lectura** (ejecutan directo): `listar_proyectos` (filtros estado/prioridad),
`listar_tareas` (filtros proyecto/estado/prioridad), `buscar_tareas_por_texto`,
`leer_nota_contexto`, `leer_next_actions`, `leer_my_day`, `listar_plantillas`.

**Escritura** (2 pasos — devuelven `confirmationId`, se ejecutan vía
`confirmar_accion`): `crear_tarea`, `actualizar_estado_tarea` (TODO/DONE...),
`crear_nota`, `mover_archivo_a_proyecto`, `generar_documento` (DOCX).

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

Configura el agente con transporte stdio (JSON-RPC estándar MCP):
- `command`: `npm`
- `args`: `["run", "mcp"]`
- `cwd`: ruta al repo de ema-os

## Limitaciones

- **Sin Google Calendar**: las tareas creadas/actualizadas vía MCP NO
  sincronizan eventos de Calendar (esa lógica vive acoplada al request context
  de Next). La UI web sigue sincronizando normalmente.
- **PDF deshabilitado**: la variante PDF de `generar_documento` tiene un bug
  preexistente (`puppeteer_1.default.launch is not a function`). Solo se
  expone la generación DOCX. El bug es de main, fuera de alcance.
- **Confirmaciones en memoria**: cada proceso MCP tiene su propio mapa de
  confirmaciones (TTL 5 min, máx 50 pendientes). No persisten entre reinicios.
