-- UX tareas v2: sello de finalización. Aditiva, nullable, sin backfill.
-- Las tareas DONE pre-existentes quedan en NULL (no aparecen en "Completadas
-- recientes" ni entran en la purga de >30 días, que filtra por completedAt).
ALTER TABLE "Tarea" ADD COLUMN "completedAt" DATETIME;
