# Conectar Hermes a EMA OS MCP

El servidor MCP de EMA OS (`mcp-server/index.ts`) expone **13 tools** vía stdio
para que agentes externos (Hermes / Dona / Claude Code) operen la app sin la UI:
listar/crear proyectos y tareas, leer Next Actions y My Day, gestionar
plantillas y generar documentos **DOCX y PDF**.

Fuente de verdad del servidor: `MCP_SERVER.md` (raíz del repo).

## Prerrequisitos

- Repo de EMA OS instalado y `emaos.db` con datos en la raíz.
- **Node >= 22.6** (type stripping nativo). Verificar: `node --v8-options | grep strip` o `node --version`.
- Dependencias instaladas: `npm install` en la raíz (el servidor MCP vive en
  `mcp-server/` pero usa el `node_modules` y el cliente Prisma de la raíz).
- No requiere que `npm run dev` esté corriendo: es un proceso independiente que
  lee `emaos.db` directo.

## Bloque de configuración (stdio) — recomendado

Hermes arranca el servidor con `npm run mcp`, que ya resuelve Node, el loader
ESM (`mcp-server/loader.mjs`), el type-stripping y `DATABASE_URL` desde `.env`.

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

`cwd` es obligatorio: el servidor resuelve `emaos.db`, `templates/` y `files/`
relativos al repo. Sin `cwd`, Hermes puede spawnearlo desde otro directorio y
fallar al encontrar la DB.

## Forma alternativa (sin envolver en npm)

Para runtimes que no aceptan `cwd` o donde el wrapper de npm estorba:

```json
{
  "mcpServers": {
    "ema-os": {
      "command": "node",
      "args": [
        "--env-file=.env",
        "--experimental-strip-types",
        "--loader", "./mcp-server/loader.mjs",
        "mcp-server/index.ts"
      ],
      "cwd": "C:/Users/EdEma/Oranizador de proyectos/ema-os"
    }
  }
}
```

> **No uses `tsx`** (forma antigua de docs previos): ya no está instalado. El
> servidor usa su propio loader ESM + type-stripping nativo de Node.

## Las 13 tools

**Lectura** (ejecutan directo, sin confirmación):
- `listar_proyectos` — filtros opcionales `estado`, `prioridad`.
- `listar_tareas` — filtros opcionales `proyecto_nombre`, `estado`, `prioridad`.
- `buscar_tareas_por_texto` — substring en el título.
- `leer_nota_contexto` — contenido Markdown de notas de un proyecto.
- `leer_next_actions` — próxima acción de cada proyecto activo.
- `leer_my_day` — `{ hoy, atrasadas, disponibles }`.
- `listar_plantillas` — `DocumentTemplate`, filtro opcional `tipo` (`docx`/`md`).

**Escritura** (2 pasos: devuelven `confirmationId`, se ejecutan con `confirmar_accion`):
- `crear_tarea` — `titulo`, `proyecto_nombre?`, `prioridad?`, `fecha?` (YYYY-MM-DD).
- `actualizar_estado_tarea` — `titulo`, `estado` (TODO/IN_PROGRESS/WAITING/DONE).
- `crear_nota` — `proyecto_nombre`, `titulo`, `contenido`.
- `mover_archivo_a_proyecto` — `archivo_titulo`, `proyecto_destino`.
- `generar_documento` — `tarea_id`, `plantilla_id`, `data?`. **DOCX o PDF**
  (PDF desde plantilla Markdown). El archivo queda en `files/<projectId>/` y se
  registra como `Archivo`.
- `confirmar_accion` — `{ confirmationId, confirm }`. `false` = cancelar.

> **Regla dura:** Dona **nunca** llama `confirmar_accion` sin mostrar la propuesta
> al usuario y obtener aprobación explícita. Las confirmaciones viven en memoria
> (TTL 5 min) — no persisten entre reinicios.

## Invocación probada

La suite `npm run test:mcp` (raíz) arranca el servidor contra una BD de prueba,
invoca las 13 tools y valida respuestas + casos borde. Salida esperada:

```
=== 24 pasaron, 0 fallaron ===
```

Ejemplo concreto de una llamada manual (cualquier cliente MCP stdio):

```
listar_proyectos {}  →  [{ "id": "…", "name": "…", "status": "ACTIVE", "priority": "HIGH", "progress": 0 }, …]
```

Para probar una sola tool con UI: MCP Inspector —

```bash
npx @modelcontextprotocol/inspector npm run mcp
```

(abrir `http://localhost:6274`; `cwd` debe ser el repo).

## Troubleshooting

- **`Cannot find module`/`protocol 'c:'`**: falta `cwd` o se pasaron paths
  absolutos. Usa siempre paths relativos + `cwd` = repo.
- **`Puppeteer/Chrome` al generar PDF**: el servidor usa el Chrome de Playwright
  si está instalado (`~/AppData/Local/ms-playwright`). Si no hay Chrome, instala
  Playwright o fija `PUPPETEER_EXECUTABLE_PATH`.
- **Las tools no aparecen tras cambiar el schema**: `npx prisma generate` y
  reiniciar Hermes (el cliente Prisma se cachea).
