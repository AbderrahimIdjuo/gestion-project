/*
  Warnings:

  - You are about to drop the column `categorie` on the `CommandesProduits` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `CommandesProduits` table. All the data in the column will be lost.
  - You are about to drop the column `prixAchat` on the `CommandesProduits` table. All the data in the column will be lost.
  - You are about to drop the column `prixVente` on the `CommandesProduits` table. All the data in the column will be lost.
  - You are about to drop the column `statut` on the `CommandesProduits` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `CommandesProduits` table. All the data in the column will be lost.
  - Added the required column `montant` to the `CommandesProduits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prixUnite` to the `CommandesProduits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantite` to the `CommandesProduits` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CommandesProduits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commandeId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnite" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommandesProduits_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commandes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CommandesProduits" ("commandeId", "createdAt", "designation", "id", "updatedAt") SELECT "commandeId", "createdAt", "designation", "id", "updatedAt" FROM "CommandesProduits";
DROP TABLE "CommandesProduits";
ALTER TABLE "new_CommandesProduits" RENAME TO "CommandesProduits";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
