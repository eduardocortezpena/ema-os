---
name: ema-os
description: Identidad, propósito, alcance y stack de EMA OS. Usar al planear cualquier feature, evaluar si algo entra en el alcance del MVP, o cuando haga falta recordar qué es y qué NO es este proyecto.
---

# EMA OS

Fuente: `PROJECT_CONTEXT.md`, `OWNER_PROFILE.md`, `.claude/docs/VISION.md`,
`.claude/docs/ARCHITECTURE.md`.

## Qué es

Organizador personal de proyectos para un único usuario (Eduardo). Debe
convertirse en su centro de operaciones y decirle siempre cuál es el
siguiente paso de cada proyecto real que administra: Xalma Residencial,
Recolector de Sargazo, Proyecto Panga, Restaurante Veracruzano, Asociación
Civil, Salsa Fest, aprendizaje de IA, automatización y publicidad.

## Qué NO es

No es un ERP, CRM ni software empresarial multiusuario. No agregar
autenticación, IA, inventario, CRM, ERP, contabilidad ni calendario hasta
que el MVP esté terminado — regla explícita de `PROJECT_CONTEXT.md` y de
CLAUDE.md ("Nunca agregar funcionalidades no solicitadas").

## Alcance del MVP

- Dashboard con datos reales (no estáticos).
- CRUD de Proyectos.
- CRUD de Tareas.
- CRUD de Notas.
- Configuración mínima.

## Stack (real, verificado)

- Next.js 16 (App Router) + React 19 + TypeScript.
- TailwindCSS v4.
- Prisma 7.8 con generator `prisma-client` (NO el patrón viejo de
  `@prisma/client` con `new PrismaClient()` — este proyecto usa un output
  custom, ver `prisma/schema.prisma`).
- SQLite (`emaos.db`) vía Server Actions, sin API routes innecesarias.

## Filosofía de trabajo (de CLAUDE.md)

Prioridad en este orden: **MVP funcional → Simplicidad → Estabilidad →
Código limpio → Verificar siempre antes de continuar.**

Ciclo: Construir → Compilar → Corregir → Commit → Continuar.

Reglas duras:
- Nunca agregar funcionalidades no solicitadas.
- Nunca detener el desarrollo por decisiones menores.
- Nunca marcar una tarea como terminada sin cumplir [[definition-of-done]].

## Cómo aplicar

Antes de aceptar o proponer una feature, preguntar: ¿está en el alcance
del MVP de arriba? Si no, se anota en `.claude/docs/BACKLOG.md` y no se
implementa ahora. Para el estado *actual* (qué funciona de verdad hoy,
no lo que dicen los docs), ver [[project-memory]].
