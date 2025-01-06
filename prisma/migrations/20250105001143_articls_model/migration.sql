/*
  Warnings:

  - You are about to drop the column `validite` on the `Devis` table. All the data in the column will be lost.
  - Added the required column `description` to the `Produits` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Articls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnite" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Articls_deviId_fkey" FOREIGN KEY ("deviId") REFERENCES "Devis" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Devis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "statut" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Devis" ("clientId", "createdAt", "id", "montant", "numero", "statut", "updatedAt") SELECT "clientId", "createdAt", "id", "montant", "numero", "statut", "updatedAt" FROM "Devis";
DROP TABLE "Devis";
ALTER TABLE "new_Devis" RENAME TO "Devis";
CREATE UNIQUE INDEX "Devis_numero_key" ON "Devis"("numero");
CREATE TABLE "new_Produits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designation" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "prixAchat" REAL NOT NULL,
    "prixVente" REAL NOT NULL,
    "statut" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Produits" ("categorie", "createdAt", "designation", "id", "prixAchat", "prixVente", "statut", "stock", "updatedAt") SELECT "categorie", "createdAt", "designation", "id", "prixAchat", "prixVente", "statut", "stock", "updatedAt" FROM "Produits";
DROP TABLE "Produits";
ALTER TABLE "new_Produits" RENAME TO "Produits";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
