-- CreateTable
CREATE TABLE "AchatsCommandes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "produitId" TEXT NOT NULL,
    "fournisseurId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnite" REAL NOT NULL,
    "montant" REAL NOT NULL,
    "statut" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AchatsCommandes_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AchatsCommandes_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseurs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "avance" INTEGER,
    "echeance" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commandes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Commandes" ("avance", "clientId", "createdAt", "echeance", "fraisLivraison", "id", "note", "numero", "reduction", "sousTotal", "statut", "total", "typeReduction", "updatedAt") SELECT "avance", "clientId", "createdAt", "echeance", "fraisLivraison", "id", "note", "numero", "reduction", "sousTotal", "statut", "total", "typeReduction", "updatedAt" FROM "Commandes";
DROP TABLE "Commandes";
ALTER TABLE "new_Commandes" RENAME TO "Commandes";
CREATE UNIQUE INDEX "Commandes_numero_key" ON "Commandes"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
