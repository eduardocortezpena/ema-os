-- AlterTable: trazabilidad reversible de la migración Nota->Archivo (Sprint 3.3)
ALTER TABLE "Archivo" ADD COLUMN "sourceNotaId" TEXT;

-- CreateIndex: idempotencia del backfill (una nota -> a lo sumo un Archivo)
CREATE UNIQUE INDEX "Archivo_sourceNotaId_key" ON "Archivo"("sourceNotaId");
