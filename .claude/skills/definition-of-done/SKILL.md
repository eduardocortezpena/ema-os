---
name: definition-of-done
description: Checklist de criterios que una tarea debe cumplir antes de marcarse como terminada en EMA OS. Usar antes de reportar cualquier feature, fix o tarea de sprint como completada, y durante revisiones de código (reviewer).
---

# Definition of Done — EMA OS

Referenciado desde `.claude/docs/SPRINT.md`. Ninguna tarea se marca como
completada si no cumple **todos** los puntos siguientes.

## Checklist obligatorio

1. **Compila de verdad.** `npm run build` termina sin errores de
   TypeScript ni de bundling. No basta con que el editor no marque error.
2. **Se ejecutó, no se asumió.** La funcionalidad se probó corriendo
   `npm run dev` y usándola (o consultando la base de datos con
   `better-sqlite3`/prisma), no solo leyendo el código. Ver
   [[project-memory]] — "verificar siempre el resultado ejecutando
   npm run dev".
3. **Una sola fuente de verdad por concepto.** No hay dos implementaciones
   paralelas del mismo Server Action, ni dos clientes Prisma distintos, ni
   componentes duplicados. Si algo queda obsoleto al terminar la tarea, se
   borra en el mismo cambio (no se deja "por si acaso").
4. **Sin alcance añadido.** Solo se hizo lo pedido. Nada de features,
   refactors o abstracciones no solicitadas (regla de CLAUDE.md).
5. **Sin imports ni rutas rotas.** Cualquier `import` nuevo se verificó
   que resuelve (el módulo existe y exporta lo que se está importando).
6. **Consistente con [[ui-guidelines]]** si la tarea toca UI, y con la
   arquitectura descrita en `.claude/docs/ARCHITECTURE.md` si toca
   backend/datos.
7. **Estado del repo comunicado.** Si quedan cambios sin commitear, se
   informa explícitamente al usuario — no se asume que "terminado" incluye
   "guardado".
8. **Memoria del proyecto actualizada si el estado real cambió.**
   Si la tarea cierra un bloqueador o completa algo listado en
   `SPRINT.md`/`BACKLOG.md`, esos archivos se actualizan para reflejar el
   estado real (ver [[project-memory]]).

## Señales de que NO está terminado

- "Debería funcionar" sin haberlo corrido.
- El build pasa pero la página muestra datos falsos/estáticos en vez de
  la base de datos real.
- Hay un `TODO`, `// @ts-ignore` nuevo, o un catch vacío tapando el error
  real.
- La tarea resolvió el síntoma pero dejó el código muerto que lo causaba
  (ej. el otro archivo duplicado sigue ahí).

## Cómo aplicar

Antes de reportar cualquier tarea como completa (fix, feature, sprint
item), recorrer esta lista explícitamente. Si algo falla, la tarea sigue
`in_progress`, no `completed` — regla de CLAUDE.md: "Nunca marcar una
tarea como terminada sin cumplir la Definition of Done."
