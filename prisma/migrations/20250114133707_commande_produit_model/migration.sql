/*
  Warnings:

  - You are about to drop the column `montant` on the `Commandes` table. All the data in the column will be lost.
  - Added the required column `fraisLivraison` to the `Commandes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero` to the `Commandes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reduction` to the `Commandes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sousTotal` to the `Commandes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Commandes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "CommandesProduits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designation" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "prixAchat" REAL NOT NULL,
    "prixVente" REAL NOT NULL,
    "statut" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "description" TEXT,
    "commandeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommandesProduits_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commandes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commandes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Commandes" ("clientId", "createdAt", "id", "statut", "updatedAt") SELECT "clientId", "createdAt", "id", "statut", "updatedAt" FROM "Commandes";
DROP TABLE "Commandes";
ALTER TABLE "new_Commandes" RENAME TO "Commandes";
CREATE UNIQUE INDEX "Commandes_numero_key" ON "Commandes"("numero");
CREATE TABLE "new_Devis" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Devis" ("clientId", "createdAt", "fraisLivraison", "id", "note", "numero", "reduction", "sousTotal", "statut", "total", "typeReduction", "updatedAt") SELECT "clientId", "createdAt", "fraisLivraison", "id", "note", "numero", "reduction", "sousTotal", "statut", "total", "typeReduction", "updatedAt" FROM "Devis";
DROP TABLE "Devis";
ALTER TABLE "new_Devis" RENAME TO "Devis";
CREATE UNIQUE INDEX "Devis_numero_key" ON "Devis"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
