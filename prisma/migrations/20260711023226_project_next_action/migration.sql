-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Proyecto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'LOW',
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "nextAction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "nextActionTaskId" TEXT,
    CONSTRAINT "Proyecto_nextActionTaskId_fkey" FOREIGN KEY ("nextActionTaskId") REFERENCES "Tarea" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Proyecto" ("createdAt", "description", "id", "name", "nextAction", "priority", "progress", "status", "updatedAt") SELECT "createdAt", "description", "id", "name", "nextAction", "priority", "progress", "status", "updatedAt" FROM "Proyecto";
DROP TABLE "Proyecto";
ALTER TABLE "new_Proyecto" RENAME TO "Proyecto";
CREATE UNIQUE INDEX "Proyecto_nextActionTaskId_key" ON "Proyecto"("nextActionTaskId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
