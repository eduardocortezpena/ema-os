-- Sprint 4.3: preset de recordatorios del evento de Calendar. Aditiva, con
-- default aplicado a las filas existentes (DEFAULT = 3 y 5 días antes).
ALTER TABLE "Tarea" ADD COLUMN "reminderPreset" TEXT NOT NULL DEFAULT 'DEFAULT';
