-- CreateTable
CREATE TABLE "GoogleDriveToken" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "refreshTokenCipher" TEXT NOT NULL,
    "refreshTokenIv" TEXT NOT NULL,
    "refreshTokenAuthTag" TEXT NOT NULL,
    "accessToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);
