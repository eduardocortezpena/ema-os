# Skill de Auditoría de Modelos — Para Dona

## Propósito

Dona ejecuta este procedimiento una vez al mes para verificar que los
modelos en la cadena de OpenRouter de EMA OS siguen existiendo y siendo
`:free`. Si alguno cayó, reporta al usuario.

Este documento es solo la especificación del procedimiento. La configuración
del cron en Hermes la hace el usuario manualmente.

---

## Procedimiento

### 1. Leer la cadena actual

Leer la sección "Modelos de OpenRouter" de `CLAUDE.md` en la raíz del
proyecto de EMA OS. Extraer todos los model IDs que aparecen.

### 2. Verificar cada modelo contra la API de OpenRouter

Para cada model ID en la lista:

```
GET https://openrouter.ai/api/v1/models
```

(Sin autenticación. El endpoint es público.)

Buscar el model ID en la respuesta. Verificar:
- Existe en el listado (`id` coincide exactamente).
- Su `pricing.prompt` y `pricing.completion` son `"0"` (indica que es
  `:free` en este momento).

### 3. Reportar al usuario

Si **todos los modelos** pasan: no hace falta reportar nada (silencioso
cuando todo está bien).

Si **alguno falla** (no existe o ya no es gratis), Dona envía un mensaje
al usuario con:

```
⚠️ Auditoría mensual de modelos OpenRouter — [fecha]

Modelos con problema:
- [model-id]: [no existe / ya no es :free]

Modelos OK:
- [model-id] ✓
- ...

Acción recomendada: actualizar la cadena en CLAUDE.md con un modelo
:free que lo reemplace.
```

### 4. No hacer nada más

Dona **no actualiza CLAUDE.md** automáticamente. Solo reporta. El usuario
decide qué modelo nuevo poner.

---

## Cadena actual a auditar (al momento de escribir este doc — 2026-07-18)

| Agente | Modelo | Posición |
|--------|--------|----------|
| DEFAULT (Dona y todos salvo Señor Dev) | `nvidia/nemotron-3-super:free` | 1 |
| DEFAULT | `nvidia/nemotron-3-ultra:free` | 2 |
| DEFAULT | `meta-llama/llama-3.3-70b-instruct:free` | 3 |
| Señor Dev | `poolside/laguna-m.1:free` | 1 (expira ~28 jul 2026) |
| Señor Dev | `poolside/laguna-xs-2.1:free` | 2 |
| Señor Dev | `cohere/north-mini-code:free` | 3 |
| Señor Dev | `nvidia/nemotron-3-super:free` | 4 |
| /assistant interno | `nvidia/nemotron-nano-9b-v2:free` | único |

> La fuente de verdad siempre es `CLAUDE.md`, no esta tabla. Si hay
> discrepancia, `CLAUDE.md` manda.

---

## Configurar el cron en Hermes (lo hace el usuario)

En el perfil de Dona en Hermes, crear una tarea programada mensual con
el prompt:

```
Ejecuta el procedimiento de Skill de Auditoría de Modelos documentado
en .claude/docs/SKILL_AUDITORIA_MODELOS.md del proyecto EMA OS.
```

Frecuencia sugerida: primer día de cada mes.
