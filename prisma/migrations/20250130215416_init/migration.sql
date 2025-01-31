-- CreateTable
CREATE TABLE "Clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Produits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designation" TEXT NOT NULL,
    "categorie" TEXT,
    "prixAchat" REAL,
    "prixVente" REAL,
    "stock" INTEGER,
    "fournisseurId" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Produits_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseurs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommandesProduits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commandeId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnite" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommandesProduits_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommandesProduits_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commandes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fournisseurs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ice" TEXT,
    "telephoneSecondaire" TEXT
);

-- CreateTable
CREATE TABLE "Commandes" (
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
    "echeance" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commandes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AchatsCommandes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "produitId" TEXT NOT NULL,
    "commandeId" TEXT,
    "quantite" INTEGER NOT NULL,
    "prixUnite" REAL,
    "payer" BOOLEAN NOT NULL,
    "statut" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AchatsCommandes_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commandes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AchatsCommandes_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    CONSTRAINT "Articls_deviId_fkey" FOREIGN KEY ("deviId") REFERENCES "Devis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Devis" (
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
    CONSTRAINT "Devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Factures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "statut" TEXT NOT NULL,
    "echeance" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Commandes_numero_key" ON "Commandes"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Devis_numero_key" ON "Devis"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Factures_numero_key" ON "Factures"("numero");
