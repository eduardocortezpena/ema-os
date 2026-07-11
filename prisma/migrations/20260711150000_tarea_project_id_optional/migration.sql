-- RedefineTables: Tarea.projectId pasa a nullable (Sprint 7.4, Quick Capture
-- inbox). SQLite no soporta ALTER COLUMN DROP NOT NULL directo; se
-- reconstruye la tabla siguiendo el patrón que ya usa este proyecto
-- (ver 20260711023226_project_next_action). Tabla vacía en este momento,
-- sin backfill necesario.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tarea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'LOW',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "plannedFor" DATETIME,
    CONSTRAINT "Tarea_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Proyecto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tarea" ("id", "projectId", "title", "description", "priority", "status", "dueDate", "createdAt", "updatedAt", "plannedFor")
SELECT "id", "projectId", "title", "description", "priority", "status", "dueDate", "createdAt", "updatedAt", "plannedFor" FROM "Tarea";
DROP TABLE "Tarea";
ALTER TABLE "new_Tarea" RENAME TO "Tarea";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
