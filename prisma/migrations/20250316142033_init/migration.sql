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
CREATE TABLE "Employes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "cin" TEXT,
    "rib" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "role" TEXT,
    "salaire" REAL,
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
    "totalPaye" REAL,
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
    "lable" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "montant" REAL,
    "payer" BOOLEAN NOT NULL DEFAULT false,
    "dateEmission" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "compte" TEXT,
    "lable" TEXT,
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TachesEmployes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tache" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CategoriesProduits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categorie" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ComptesBancaires" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compte" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ModesPaiement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modePaiement" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "InfoEntreprise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "adresse" TEXT NOT NULL,
    "slogan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CommandesProduits_commandeId_produitId_key" ON "CommandesProduits"("commandeId", "produitId");

-- CreateIndex
CREATE UNIQUE INDEX "Commandes_numero_key" ON "Commandes"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "AchatsCommandes_commandeId_produitId_key" ON "AchatsCommandes"("commandeId", "produitId");

-- CreateIndex
CREATE UNIQUE INDEX "Devis_numero_key" ON "Devis"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Factures_numero_key" ON "Factures"("numero");
