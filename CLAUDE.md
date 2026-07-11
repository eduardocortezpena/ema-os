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

## Checklist de inicio de sesión

Se aplica SIEMPRE al empezar cualquier sesión nueva de trabajo en este
proyecto, sin que el usuario tenga que pedirlo:

1. Leer `.claude/docs/SPRINT.md` y `.claude/docs/BACKLOG.md` para retomar
   el estado exacto donde quedó la sesión anterior.
2. Confirmar `git status` limpio (sin cambios sin commitear) antes de
   empezar a programar.
3. Correr `npm run build` y confirmar que compila limpio desde la sesión
   anterior. Si algo se rompió, arreglarlo antes de seguir con cualquier
   feature nueva.
4. Si hubo una migración de Prisma en la sesión anterior (revisar en
   `SPRINT.md`): correr `npx prisma generate`, verificar que
   `app/lib/db.ts` sigue intacto, y reiniciar `npm run dev` (Turbopack
   cachea el cliente viejo en memoria y provoca falsos errores si no se
   reinicia).
5. Confirmar que `.claude/skills/` y `.claude/agents/` siguen activos sin
   conflictos (nombres duplicados, frontmatter inválido) — solo si hubo
   cambios recientes en esa carpeta.

## Reglas permanentes de verificación

- Toda funcionalidad se prueba en navegador real (`npm run dev`), no solo
  con `npm run build`. El build limpio no es evidencia de que algo
  funciona, solo de que compila.
- El navegador de pruebas de este entorno tiene timing errático con
  clicks en formularios; cuando falle, usar manipulación de DOM vía JS y
  verificar el resultado contra la base de datos directamente.
- No decir "listo" o "completado" sin mostrar el comando ejecutado y su
  output como evidencia.
- Usar el subagente `reviewer` al cerrar cada sprint, y que corra el
  build por su cuenta en vez de confiar en el resumen del sprint.
- Administrar el presupuesto de tokens de la sesión: si el límite se
  acerca, cerrar el sprint en curso en verde (build limpio + commit +
  `SPRINT.md` actualizado) y parar, en vez de dejar un sprint a medias.

## Mapa de fases

Fuente de verdad: `.claude/docs/ROADMAP.md`. Numeración fijada el
2026-07-11 para que coincida con lo realmente ejecutado (antes hubo
confusión entre sesiones sobre qué fase era cuál — no reintroducirla).

- **Fase 0** — Cerrar el MVP existente ✅ completa
- **Fase 1** — Núcleo de priorización "¿qué hago ahora?" ✅ completa
  (incluye Next Action por proyecto y vista "My Day"; Sprint 1.5 —orden
  sugerido automático— opcional, pendiente)
- **Fase 2** — Notas Markdown + sincronización con Google Drive
- **Fase 3** — Google Calendar como pilar
- **Fase 4** — IA con OpenRouter (BYOK)
- **Fase 5** — Documentos automáticos
- **Fase 6** — UX avanzada
- **Fase 7** — Endurecimiento y pulido final
