/*
  Warnings:

  - Added the required column `note` to the `Devis` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Devis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "sousTotal" REAL NOT NULL,
    "fraisLivraison" REAL NOT NULL,
    "reduction" INTEGER NOT NULL,
    "total" REAL NOT NULL,
    "note" TEXT NOT NULL,
    "typeReduction" TEXT NOT NULL DEFAULT '%',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Devis" ("clientId", "createdAt", "fraisLivraison", "id", "numero", "reduction", "sousTotal", "statut", "total", "updatedAt") SELECT "clientId", "createdAt", "fraisLivraison", "id", "numero", "reduction", "sousTotal", "statut", "total", "updatedAt" FROM "Devis";
DROP TABLE "Devis";
ALTER TABLE "new_Devis" RENAME TO "Devis";
CREATE UNIQUE INDEX "Devis_numero_key" ON "Devis"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
