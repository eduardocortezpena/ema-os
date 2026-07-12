-- Sprint 4.2: espejo de evento de Google Calendar por tarea (mismo patrón
-- que Archivo.driveFileId). Aditiva, sin backfill.
ALTER TABLE "Tarea" ADD COLUMN "eventId" TEXT;
