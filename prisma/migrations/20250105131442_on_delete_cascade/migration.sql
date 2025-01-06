-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Articls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnite" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Articls_deviId_fkey" FOREIGN KEY ("deviId") REFERENCES "Devis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Articls" ("createdAt", "designation", "deviId", "id", "montant", "prixUnite", "quantite", "updatedAt") SELECT "createdAt", "designation", "deviId", "id", "montant", "prixUnite", "quantite", "updatedAt" FROM "Articls";
DROP TABLE "Articls";
ALTER TABLE "new_Articls" RENAME TO "Articls";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
