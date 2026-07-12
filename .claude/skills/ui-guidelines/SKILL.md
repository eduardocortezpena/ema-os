---
name: ui-guidelines
description: Convenciones visuales y de componentes de EMA OS (paleta, tipografía, layout, estados). Usar al construir o revisar cualquier página, componente o formulario nuevo.
---

# UI Guidelines — EMA OS

Fuente: `app/globals.css`, `app/layout.tsx` (reales, no inventadas) y
`PROJECT_MEMORY.md` ("UI inspirada en Linear, Notion y Vercel").

## Tema

La app es **dark-only**, sin toggle de tema. `app/layout.tsx` fija
`bg-gray-950 text-gray-100` en el `<body>`. **No usar** clases `dark:` ni
asumir modo claro — si una página tiene `bg-white dark:bg-gray-800`, está
rota respecto al resto de la app (esto ya pasó en `dashboard/page.tsx` y
`projects/page.tsx`, hay que corregirlo, no repetirlo).

## Paleta (tokens reales de `app/globals.css`)

- Fondo base: `gray-950` (`#030712`). Superficies/cards: `gray-900` /
  `gray-800`. Bordes: `gray-700` / `gray-800`.
- Texto principal: `gray-100`. Texto secundario: `gray-400`/`gray-500`.
- Acento: `primary-500` (`#3b82f6`), hover `primary-600`.
- Semánticos: `success-500` (verde, DONE/COMPLETED), `warning-500`
  (ámbar, WAITING/PAUSED), `danger-500` (rojo, eliminar/CRITICAL).

## Layout

- Sidebar fijo (`aside`, 16rem / `w-64`) con nav a Dashboard, My Day,
  Inbox, Projects, Tasks, Files, Settings — definido una sola vez en
  `app/layout.tsx`. Notas ya no es una sección propia (Sprint 9.3): su
  contenido vive en el detalle de cada proyecto (`/projects/[id]`). Las
  páginas hijas **no** deben reimplementar su propio wrapper de layout.
- Contenido principal en `<main className="flex-1 p-6 overflow-auto">`.
- Vistas tipo lista+formulario usan grid `lg:grid-cols-3`: contenido a la
  izquierda (`lg:col-span-2`), formulario/panel lateral a la derecha.

## Componentes y clases utilitarias ya definidas

Reusar, no reinventar:
- `.card` — contenedor con fondo, borde y padding estándar.
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger` — botones.
- `.badge` + `.badge-{low,medium,high,critical}` (prioridad) y
  `.badge-{planning,active,paused,completed}` /
  `.badge-{todo,in_progress,waiting,done}` (status) — usar
  `badge-${valor.toLowerCase()}`, ya es el patrón usado en
  `app/tasks/page.tsx`.
- Inputs/selects/textareas ya tienen estilos globales (fondo `gray-800`,
  borde `gray-700`, focus ring `primary-500`) — no reescribir estilos de
  formulario por página.

## Estados de UI obligatorios por vista de datos

Cada página que lista datos de la base de datos debe manejar:
1. Estado vacío ("No tasks yet. Create one below!" es el patrón de
   referencia en `app/tasks/page.tsx`).
2. Confirmación antes de eliminar (`confirm()` en el `onSubmit` del form
   de delete, como en `app/tasks/page.tsx`).
3. Nunca mostrar datos de ejemplo hardcodeados como si fueran reales
   (`app/notes/page.tsx` lo hacía con `useState` local — es lo que hay
   que evitar).

## Cómo aplicar

Antes de dar por buena una página nueva o modificada, compararla contra
`app/tasks/page.tsx` como referencia de patrón correcto (layout, badges,
formulario, confirmación de borrado, estado vacío). Cualquier
inconsistencia de tema o de componentes reinventados es un hallazgo de
[[definition-of-done]].
