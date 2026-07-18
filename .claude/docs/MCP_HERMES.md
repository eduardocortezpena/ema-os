# Conectar Hermes a EMA OS MCP

## Qué es esto

El servidor MCP de EMA OS corre en `mcp-server/index.ts` y expone 9 tools
(8 de la Fase 6 + `confirmar_accion`) via stdio. Hermes/Dona puede usarlas
conectándose como cliente MCP.

## Prerequisito

EMA OS debe estar instalado y la DB (`emaos.db`) debe existir en la raíz del
proyecto. El servidor MCP no requiere que `npm run dev` esté corriendo — es
un proceso independiente.

Instalar dependencias del servidor MCP (una sola vez):

```bash
cd "C:\Users\EdEma\Oranizador de proyectos\ema-os\mcp-server"
npm install
```

## Conectar desde Claude Desktop (Hermes)

Editar `%APPDATA%\Claude\claude_desktop_config.json` y añadir dentro de
`"mcpServers"`:

```json
{
  "mcpServers": {
    "ema-os": {
      "command": "node",
      "args": [
        "C:/Users/EdEma/Oranizador de proyectos/ema-os/mcp-server/node_modules/tsx/dist/cli.mjs",
        "C:/Users/EdEma/Oranizador de proyectos/ema-os/mcp-server/index.ts"
      ],
      "env": {
        "DATABASE_URL": "file:C:/Users/EdEma/Oranizador de proyectos/ema-os/emaos.db"
      }
    }
  }
}
```

> Nota: se usa ruta absoluta en `DATABASE_URL` para que el servidor MCP
> encuentre la DB sin importar desde qué directorio lo spawnea Claude Desktop.

Reiniciar Claude Desktop. Las tools aparecerán automáticamente en Dona y
cualquier otro perfil/proyecto de Hermes que use ese config.

## Conectar desde Claude Code (cli)

```bash
claude mcp add ema-os \
  --command "node" \
  --args "C:/Users/EdEma/Oranizador de proyectos/ema-os/mcp-server/node_modules/tsx/dist/cli.mjs" \
  --args "C:/Users/EdEma/Oranizador de proyectos/ema-os/mcp-server/index.ts" \
  --env "DATABASE_URL=file:C:/Users/EdEma/Oranizador de proyectos/ema-os/emaos.db"
```

## Uso desde Hermes

Las 4 tools de **lectura** ejecutan directo:
- `listar_proyectos` — todos los proyectos con estado y prioridad
- `listar_tareas` — con filtros opcionales de proyecto/estado
- `buscar_tareas_por_texto` — búsqueda por substring en título
- `leer_nota_contexto` — contenido Markdown de notas de un proyecto

Las 4 tools de **escritura** requieren confirmación en 2 pasos:

1. Llamar `crear_tarea` / `crear_nota` / `completar_tarea` /
   `mover_archivo_a_proyecto` → devuelve `{status: "pending_confirmation",
   confirmationId, propuesta}`.
2. Llamar `confirmar_accion({confirmationId, confirm: true})` para ejecutar,
   o `confirm: false` para cancelar.

> Regla dura: Dona **nunca** debe llamar `confirmar_accion` sin mostrarle
> al usuario la propuesta y esperar su aprobación explícita.

## Verificar que funciona

Con el MCP Inspector (requiere npm):
```bash
npx @modelcontextprotocol/inspector node \
  "C:/Users/EdEma/Oranizador de proyectos/ema-os/mcp-server/node_modules/tsx/dist/cli.mjs" \
  "C:/Users/EdEma/Oranizador de proyectos/ema-os/mcp-server/index.ts"
```

Abrir `http://localhost:5173` en el navegador y llamar `listar_proyectos`.
