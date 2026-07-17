# MASTER_CONTEXT.md — EMA OS

> Resumen compacto para dar contexto rápido (ej. a Dona en Hermes). Fuente
> de verdad detallada: `CLAUDE.md`, `.claude/docs/SPRINT.md`,
> `BACKLOG.md`, `ROADMAP.md`, `AGENTES.md`. Generado 2026-07-14.

## Qué es EMA OS

Organizador personal de proyectos de un solo usuario (Eduardo Emmanuel
Cortez Peña). Next.js 16 + Prisma + SQLite local. NO es ERP/CRM, NO
multiusuario, NO servicios de pago recurrente (open source/self-hosted
únicamente). Ubicación real del repo:
`C:\Users\EdEma\Oranizador de proyectos\ema-os`.

## Stack real

Next.js 16.2.10 (Turbopack, App Router) + React 19 + Prisma 7 +
`better-sqlite3` + Tailwind 4. Cero dependencias de UI pesadas (solo
`cmdk` para el command palette). Dark-only, sin toggle de tema.

## Estado por fase (ver ROADMAP.md para detalle completo)

- **Fase 0-1** (MVP + priorización): ✅ 100% completas.
- **Fase 3** (Google Drive): 🟡 Parcial — OAuth, notas Markdown y subida
  de archivos funcionan; Sprint 3.5 (rclone bisync) pendiente, `rclone`
  no instalado todavía, plan documentado en SPRINT.md.
- **Fase 4** (Google Calendar): ✅ 100% completa (4.1-4.4) — sync
  tarea↔evento, recordatorios, agenda en dashboard.
- **Fase 7** (UX avanzada): ✅ 100% completa (command palette, atajos,
  optimistic UI, Quick Capture).
- **Fase 9** (Interactividad): ✅ 9.1-9.4 completas; 9.5 opcional, no
  tocada.
- **Sesión UX + Sesión supervisión parcial** (fuera de la numeración de
  fases, pedidos directos del dueño): renombrado a "Organizador de
  archivos", tareas/prioridad cíclicas con un clic, botón de completar
  en 5 vistas, vista `/calendar`, acceso LAN al teléfono (confirmado
  funcionando, con bug de Tailscale pendiente de diagnóstico).
- **Fase 2** (Clasificador de archivos), **Fase 5** (Documentos
  automáticos), **Fase 6** (IA/OpenRouter): ⬜ sin empezar.
- **Fase 6.5** (Hermes): borrador de diseño listo (`AGENTES.md`), CERO
  código — integración pendiente de sesión supervisada.
- **Fase 10** (Estilización): deliberadamente abierta, sin sprints,
  esperando herramientas de diseño que el dueño va a conseguir.

## Decisiones ya tomadas (no relitigar)

- EMA OS es el cerebro, Hermes es el canal — la lógica vive en Server
  Actions de EMA OS, los agentes solo las invocan.
- Un agente Organizador YA opera por fuera de EMA OS
  (`C:\Users\EdEma\Desktop\Proyectos`), con más autonomía que el
  borrador cauteloso de `AGENTES.md` — discrepancia sin resolver.
- Acceso remoto fuera de casa: Tailscale ya instalado y con el teléfono
  enrolado, pero rompe el internet general del celular al activarse —
  bug real sin diagnosticar.
- No WhatsApp vía API no oficial. No Ollama (hardware insuficiente). No
  dark/light toggle.

## Pendientes inmediatos (ver BACKLOG.md para la lista completa)

- Diagnosticar el bug de Tailscale (corta internet del teléfono).
- Layout móvil roto en algunas páginas (sin detalle todavía, candidato
  a Fase 10).
- Instalar `rclone` antes de poder ejecutar el plan de espejo a Drive ya
  documentado.
- Aclarar con el dueño la discrepancia de autonomía del agente
  Organizador real vs. el borrador de `AGENTES.md`.

## Reglas de trabajo permanentes

Ver `CLAUDE.md` completo. Resumen: nunca agregar funcionalidades no
solicitadas, verificar en navegador con datos reales (no solo build),
`architect` antes de decisiones estructurales, `reviewer` al cerrar
partes grandes, commit por parte, documentación actualizada en el mismo
cambio que cierra el trabajo.
