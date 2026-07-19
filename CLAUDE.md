@AGENTS.md

# Goal Permanente

Construir EMA OS como un sistema operativo personal para la gestión de proyectos.

Prioridades:

1. MVP funcional.
2. Simplicidad.
3. Estabilidad.
4. Código limpio.
5. Verificar siempre antes de continuar.

Reglas:

- Nunca agregar funcionalidades no solicitadas.
- Nunca detener el desarrollo por decisiones menores.
- Nunca marcar una tarea como terminada sin cumplir la Definition of Done.
- Prompts a agentes: UNA tarea de alcance cerrado por sesión. Referenciar
  lecturas previas, no releer.

## Checklist de inicio de sesión

Se aplica SIEMPRE al empezar cualquier sesión nueva, sin que el usuario tenga
que pedirlo:

1. Leer `.claude/docs/SPRINT.md` y `.claude/docs/BACKLOG.md` para retomar
   el estado exacto donde quedó la sesión anterior.
2. Confirmar `git status` limpio antes de empezar a programar.
3. Correr `npm run build` y confirmar que compila limpio. Si algo se rompió,
   arreglarlo antes de cualquier feature nueva.
4. Si hubo migración de Prisma (ver `SPRINT.md`): `npx prisma generate` y
   reiniciar el proceso de `npm run dev` (Turbopack cachea el cliente viejo).

## Reglas permanentes de verificación

- Toda funcionalidad se prueba en navegador real (`npm run dev`), no solo con
  `npm run build`. El build limpio no es evidencia de que algo funciona.
- El navegador de pruebas tiene timing errático en formularios; cuando falle,
  usar manipulación de DOM vía JS y verificar contra la BD directamente.
- No decir "listo" sin mostrar el comando ejecutado y su output como evidencia.
- Usar el subagente `reviewer` al cerrar cada sprint.
- Si el presupuesto de tokens se acerca al límite: cerrar en verde (build limpio
  + commit + `SPRINT.md` actualizado) y parar. Nunca dejar un sprint a medias.

## Mapa de fases

Fuente de verdad: `.claude/docs/ROADMAP.md`. La numeración se renumeró dos veces
— ante cualquier duda, confirmar el número de fase contra `ROADMAP.md`, nunca
asumirlo del prompt del usuario.

## Arquitectura de memoria

### Archivos de contexto vivos (única fuente de verdad)

Mantener actualizados. Actualizar en el mismo commit que cierra el trabajo:

1. `CLAUDE.md` (este archivo)
2. `.claude/docs/SPRINT.md`
3. `.claude/docs/BACKLOG.md`
4. `.claude/docs/ROADMAP.md`
5. `.claude/docs/AGENTES.md`
6. `.claude/docs/BITACORA.md`

### Tope duro: 80-100 líneas por archivo vivo

Al superar 100 líneas: rotar contenido viejo a
`.claude/docs/archive/<NOMBRE>_HISTORICO.md` (append al final, separador de
fecha). **Copia ciega — NO leer ni resumir, copiar completo.** El archivo activo
queda solo con el estado actual.

### PROHIBIDO leer archive/

No leer `.claude/docs/archive/` salvo orden directa del usuario.

### Bitácora obligatoria

Todo agente al cerrar una tarea DEBE agregar su entrada en `BITACORA.md` antes
de hacer commit. Formato: `fecha | agente | acción | resultado`.
Agentes válidos: Claude Code / Z Code / Hermes-Organizador / Hermes-Becario /
Hermes-Dona.

### MASTER_CONTEXT.md

Generado a partir de los 6 vivos, nunca editado a mano. Regenerar solo cuando
cambia algo sustancial (fase completada, cambio de prioridades, agentes nuevos).
Ningún agente de Hermes recibe los 6 documentos fuente — solo `MASTER_CONTEXT.md`.

Cualquier `.md` fuera de la lista de 6 es sospechoso: auditar antes de confiar.

## Revisión semanal de salud del proyecto

**Cuándo:** al inicio de la primera sesión de trabajo después de 7 días desde el
último commit de documentación (revisar con `git log --oneline -- "*.md"`).

**Qué revisar (en orden):**

1. **Archivos vivos**: verificar que los 6 están actualizados y reflejan el estado
   real. Si alguno está stale (no se tocó en la sesión que cerró trabajo), corregirlo.
2. **Tope de líneas**: `wc -l` sobre los 6 vivos. Si alguno supera 100 líneas,
   rotar inmediatamente (copia ciega a archive/).
3. **Archive/**: confirmar que solo tiene históricos nombrados `*_HISTORICO.md`.
   Si hay archivos sueltos o con nombres raros, reportar al dueño antes de mover.
4. **MASTER_CONTEXT.md**: verificar que su contenido coincide con el estado real
   del ROADMAP.md y AGENTES.md. Si está desactualizado, regenerar.
5. **Rutas en CLAUDE.md**: confirmar que todos los archivos mencionados en este
   documento siguen existiendo. Si se movió o renombró algo, actualizar aquí.
6. **BITACORA.md**: confirmar que tiene entradas de las sesiones recientes. Si
   falta alguna, reconstruirla desde el `git log`.

La revisión no requiere aprobación del dueño para ejecutarse — es mantenimiento
rutinario. Si se detecta algo que requiere una decisión (borrar un archivo,
cambiar estructura), reportar y esperar confirmación antes de actuar.

## Proveedor: esta CLI usa solo Z.ai (GLM), no Anthropic

Esta terminal de Claude Code está desconectada de la cuenta Anthropic
(`claude auth logout` aplicado) y fijada a `glm-5.2` vía Z.ai — nunca consume
tokens de la suscripción Claude Pro. La app de escritorio de Claude es la
sesión separada para eso. Reconfigurar: `& "$env:USERPROFILE\.claude\switch-mode.ps1" glm`.

## Modelos de OpenRouter

Cadena por defecto para **Dona y todos los agentes salvo Señor Dev**:
1. `nvidia/nemotron-3-super:free`
2. `nvidia/nemotron-3-ultra:free`
3. `meta-llama/llama-3.3-70b-instruct:free`

Cadena para **Señor Dev** (especializada en código):
1. `poolside/laguna-m.1:free` — expira ~28 jul 2026
2. `poolside/laguna-xs-2.1:free`
3. `cohere/north-mini-code:free`
4. `nvidia/nemotron-3-super:free`

Modelo del `/assistant` interno: `nvidia/nemotron-nano-9b-v2:free` (fijado en
Sprint 6.3). Toda la cadena debe ser `:free` — imposible consumir créditos por
accidente. Cuando un modelo `:free` se retira, su ID deja de existir y la cadena
cae sola.

## Reglas para trabajadores externos (Antigravity / Señor Dev)

**Archivos prohibidos (nunca tocar sin autorización explícita):**
- `package.json` y `package-lock.json` (raíz del proyecto)
- `.env` y `.env.example`
- `prisma/schema.prisma` y archivos de migración
- `main` — nunca pushear directo; solo el integrador mergea

**Regla de alcance:** una rama, una tarea. El commit toca solo lo asignado.

**Regla de bloqueo:** si el build falla por trabajo ajeno, reportar y parar. No
instalar dependencias ni modificar archivos fuera del scope asignado.

**Proceso de merge:** el integrador revisa el diff completo, hace cherry-pick
selectivo si el commit mezcla cambios legítimos con violaciones, y documenta
qué se excluyó en el mensaje de commit.

## graphify

This project has a knowledge graph at `graphify-out/`.

- For codebase questions, first run `graphify query "<question>"` when
  `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for
  relationships and `graphify explain "<concept>"` for focused concepts.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review.
- After modifying code, run `graphify update .` to keep the graph current.
