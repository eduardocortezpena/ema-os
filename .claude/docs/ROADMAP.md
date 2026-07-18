# ROADMAP.md — EMA OS

## Principio rector: gasto adicional = $0

Todo open source o self-hosted. Excepciones documentadas: saldo ya comprado en
OpenRouter ($10, no gasto nuevo) y tiers gratuitos de Google Drive/Calendar API.

> **Nota de numeración (2026-07-11):** roadmap renumerado DOS veces.
> Fase 0=MVP, 1=Priorización, 2=Reservada, 3=Drive, 4=Calendar, 5=IA,
> 6=Documentos, 7=UX, 8=Endurecimiento. Ante cualquier duda confirmar el
> número de fase contra este archivo, nunca asumirlo del prompt.

## Estado de fases

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | MVP (CRUD + BD real) | ✅ COMPLETA |
| 1 | Priorización / Next Action / My Day | ✅ COMPLETA |
| 2 | Reservada (candidata: Clasificador de archivos) | sin sprints |
| 3 | Google Drive (OAuth + notas + archivos) | ✅ 3.1-3.4; 3.5 OPCIONAL |
| 4 | Google Calendar | ✅ 4.1-4.4 COMPLETA |
| 5 | IA con OpenRouter | ✅ COMPLETA (implementada como Fase 6 real) |
| 6 | Documentos automáticos | ✅ 6.1-6.5 COMPLETA |
| 7 | UX avanzada (paleta, atajos, optimistic UI, inbox) | ✅ COMPLETA |
| 8 | Endurecimiento y pulido final | pendiente |
| 9 | Interactividad y navegación conectada | ✅ 9.1-9.4; 9.5 OPCIONAL |
| 10 | Estilización y pulido visual | abierta, sin sprints |

## Siguiente paso

El dueño conecta Hermes al servidor MCP local siguiendo
`.claude/docs/MCP_HERMES.md`. Después: decidir Fase 8 o Fase 10 según
prioridad.

## Pendientes de sesión supervisada

- Integración Hermes Agent ↔ EMA OS (toca BD real + decisiones de arquitectura).
- Clasificador de archivos / árbol de `/files` (requiere plan conjunto con el dueño).
- Sprint 3.5 rclone bisync (riesgo documentado de pérdida de datos).

## Qué NO hacer

- No convertir en ERP / CRM / multiusuario.
- No depender de servicios de pago recurrente (sin aprobación explícita).
- No usar Ollama (hardware insuficiente). Vía de IA = OpenRouter BYOK.
- No usar Google Keep (API solo para Google Workspace).
- No usar APIs no oficiales de WhatsApp (riesgo de baneo de número).
- No agregar funcionalidades no solicitadas.

## Riesgos conocidos

- `openrouter/free`: rota modelos, ~200 req/día no garantizados. Siempre tener fallback.
- `rclone bisync`: beta, posible pérdida de datos. Sprint 3.5 requiere supervisión.
- Scope Calendar es "sensible": requiere verificación de Google (ya resuelto en 4.1).

---
> Sprints anteriores con detalle completo en `.claude/docs/archive/ROADMAP_HISTORICO.md`.
> Al superar 100 líneas: rotar a archive/ (copia ciega, sin resumir).
