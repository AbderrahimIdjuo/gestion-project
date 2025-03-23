/*
  Warnings:

  - Added the required column `totalDevi` to the `Commandes` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Commandes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "sousTotal" REAL NOT NULL,
    "fraisLivraison" REAL NOT NULL,
    "reduction" INTEGER NOT NULL,
    "total" REAL NOT NULL,
    "note" TEXT,
    "typeReduction" TEXT NOT NULL DEFAULT '%',
    "avance" INTEGER,
    "totalDevi" REAL NOT NULL,
    "totalPaye" REAL,
    "echeance" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commandes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Commandes" ("avance", "clientId", "createdAt", "echeance", "fraisLivraison", "id", "note", "numero", "reduction", "sousTotal", "statut", "total", "totalPaye", "typeReduction", "updatedAt") SELECT "avance", "clientId", "createdAt", "echeance", "fraisLivraison", "id", "note", "numero", "reduction", "sousTotal", "statut", "total", "totalPaye", "typeReduction", "updatedAt" FROM "Commandes";
DROP TABLE "Commandes";
ALTER TABLE "new_Commandes" RENAME TO "Commandes";
CREATE UNIQUE INDEX "Commandes_numero_key" ON "Commandes"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
