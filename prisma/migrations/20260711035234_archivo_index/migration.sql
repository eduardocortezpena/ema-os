-- CreateTable
CREATE TABLE "Archivo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT,
    "driveFileId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Archivo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Proyecto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
