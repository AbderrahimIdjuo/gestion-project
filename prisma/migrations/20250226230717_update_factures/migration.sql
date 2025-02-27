/*
  Warnings:

  - You are about to drop the column `dateReglement` on the `Factures` table. All the data in the column will be lost.
  - You are about to alter the column `dateEmission` on the `Factures` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Factures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lable" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "payer" BOOLEAN NOT NULL DEFAULT false,
    "dateEmission" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Factures" ("createdAt", "dateEmission", "description", "id", "lable", "montant", "numero", "payer", "type", "updatedAt") SELECT "createdAt", "dateEmission", "description", "id", "lable", "montant", "numero", "payer", "type", "updatedAt" FROM "Factures";
DROP TABLE "Factures";
ALTER TABLE "new_Factures" RENAME TO "Factures";
CREATE UNIQUE INDEX "Factures_numero_key" ON "Factures"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
