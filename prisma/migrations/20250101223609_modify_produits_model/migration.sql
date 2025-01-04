/*
  Warnings:

  - You are about to drop the `Achats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ventes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `nom` on the `Produits` table. All the data in the column will be lost.
  - Added the required column `designation` to the `Produits` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Achats";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Ventes";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Produits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designation" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "prixAchat" REAL NOT NULL,
    "prixVente" REAL NOT NULL,
    "statut" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Produits" ("categorie", "createdAt", "id", "prixAchat", "prixVente", "statut", "stock", "updatedAt") SELECT "categorie", "createdAt", "id", "prixAchat", "prixVente", "statut", "stock", "updatedAt" FROM "Produits";
DROP TABLE "Produits";
ALTER TABLE "new_Produits" RENAME TO "Produits";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
