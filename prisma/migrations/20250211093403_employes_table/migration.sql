-- CreateTable
CREATE TABLE "Employes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "CIN" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "role" TEXT,
    "salaire" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
