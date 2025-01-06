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
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Produits" ("categorie", "createdAt", "description", "designation", "id", "prixAchat", "prixVente", "statut", "stock", "updatedAt") SELECT "categorie", "createdAt", "description", "designation", "id", "prixAchat", "prixVente", "statut", "stock", "updatedAt" FROM "Produits";
DROP TABLE "Produits";
ALTER TABLE "new_Produits" RENAME TO "Produits";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
