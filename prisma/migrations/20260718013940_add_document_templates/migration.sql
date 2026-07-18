-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "variables" TEXT DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT,
    CONSTRAINT "DocumentTemplate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Proyecto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
