/*
  Warnings:

  - You are about to drop the column `categorie` on the `Factures` table. All the data in the column will be lost.
  - You are about to drop the column `echeance` on the `Factures` table. All the data in the column will be lost.
  - You are about to drop the column `nom` on the `Factures` table. All the data in the column will be lost.
  - You are about to drop the column `statut` on the `Factures` table. All the data in the column will be lost.
  - Added the required column `lable` to the `Factures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Factures` table without a default value. This is not possible if the table is not empty.

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
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Factures" ("createdAt", "id", "montant", "numero", "updatedAt") SELECT "createdAt", "id", "montant", "numero", "updatedAt" FROM "Factures";
DROP TABLE "Factures";
ALTER TABLE "new_Factures" RENAME TO "Factures";
CREATE UNIQUE INDEX "Factures_numero_key" ON "Factures"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
