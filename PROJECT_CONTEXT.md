# EMA OS - PROJECT CONTEXT

## Propósito

EMA OS (Eduardo Management Assistant Operating System) es un organizador
personal de proyectos para un único usuario. No es un ERP, CRM ni
software empresarial. Debe convertirse en el centro de operaciones del
propietario.

## Problema que resuelve

El usuario administra simultáneamente proyectos como: - Xalma
Residencial - Recolector de Sargazo - Proyecto Panga - Restaurante
Veracruzano - Asociación Civil - Salsa Fest - Aprendizaje de IA -
Automatización y publicidad

La aplicación debe indicar siempre cuál es el siguiente paso de cada
proyecto.

## Stack

-   Next.js (App Router)
-   TypeScript
-   TailwindCSS
-   Prisma
-   SQLite
-   Server Actions

## MVP

-   Dashboard
-   CRUD de Proyectos
-   CRUD de Tareas
-   CRUD de Notas
-   Configuración mínima

No agregar todavía autenticación, IA, inventario, CRM, ERP, contabilidad
o calendario.

## Estado del desarrollo

Completado: - Repositorio Git - Next.js - Tailwind - TypeScript -
Prisma - SQLite - Schema Prisma - Layout base - Sidebar - Dashboard
inicial - CRUD inicial - Server Actions

Pendiente: - Ejecutar migración Prisma - Generar Prisma Client -
Conectar completamente UI ↔ Server Actions - Validaciones finales y
pruebas

## Bloqueador principal

Ejecutar: - npx prisma migrate dev - npx prisma generate

## Filosofía

Construir → Compilar → Corregir → Commit → Continuar.
