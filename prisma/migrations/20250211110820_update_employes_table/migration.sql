/*
  Warnings:

  - You are about to drop the column `CIN` on the `Employes` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "cin" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "role" TEXT,
    "salaire" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Employes" ("adresse", "createdAt", "id", "nom", "role", "salaire", "telephone", "updatedAt") SELECT "adresse", "createdAt", "id", "nom", "role", "salaire", "telephone", "updatedAt" FROM "Employes";
DROP TABLE "Employes";
ALTER TABLE "new_Employes" RENAME TO "Employes";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
