/*
  Warnings:

  - Added the required column `projectId` to the `Nota` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Nota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT,
    CONSTRAINT "Nota_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Proyecto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Nota_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Tarea" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Nota" ("content", "createdAt", "id", "taskId", "title", "updatedAt") SELECT "content", "createdAt", "id", "taskId", "title", "updatedAt" FROM "Nota";
DROP TABLE "Nota";
ALTER TABLE "new_Nota" RENAME TO "Nota";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
