-- CreateTable
CREATE TABLE "Clients" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "cin" TEXT,
    "rib" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "role" TEXT,
    "salaire" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produits" (
    "id" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "categorie" TEXT,
    "prixAchat" DOUBLE PRECISION,
    "prixVente" DOUBLE PRECISION,
    "stock" INTEGER,
    "fournisseurId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandesProduits" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnite" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandesProduits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fournisseurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ice" TEXT,
    "telephoneSecondaire" TEXT,

    CONSTRAINT "Fournisseurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commandes" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "sousTotal" DOUBLE PRECISION NOT NULL,
    "fraisLivraison" DOUBLE PRECISION NOT NULL,
    "reduction" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "typeReduction" TEXT NOT NULL DEFAULT '%',
    "avance" INTEGER,
    "totalDevi" DOUBLE PRECISION NOT NULL,
    "totalPaye" DOUBLE PRECISION,
    "echeance" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AchatsCommandes" (
    "id" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "commandeId" TEXT,
    "quantite" INTEGER NOT NULL,
    "prixUnite" DOUBLE PRECISION,
    "payer" BOOLEAN NOT NULL,
    "statut" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AchatsCommandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Articls" (
    "id" TEXT NOT NULL,
    "deviId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnite" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Articls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devis" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "sousTotal" DOUBLE PRECISION NOT NULL,
    "fraisLivraison" DOUBLE PRECISION NOT NULL,
    "reduction" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "typeReduction" TEXT NOT NULL DEFAULT '%',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factures" (
    "id" TEXT NOT NULL,
    "lable" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "montant" DOUBLE PRECISION,
    "payer" BOOLEAN NOT NULL DEFAULT false,
    "dateEmission" INTEGER,
    "dateReglement" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transactions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "compte" TEXT,
    "lable" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TachesEmployes" (
    "id" TEXT NOT NULL,
    "tache" TEXT NOT NULL,

    CONSTRAINT "TachesEmployes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriesProduits" (
    "id" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,

    CONSTRAINT "CategoriesProduits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComptesBancaires" (
    "id" TEXT NOT NULL,
    "compte" TEXT NOT NULL,

    CONSTRAINT "ComptesBancaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModesPaiement" (
    "id" TEXT NOT NULL,
    "modePaiement" TEXT NOT NULL,

    CONSTRAINT "ModesPaiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfoEntreprise" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "adresse" TEXT NOT NULL,
    "logoUrl" TEXT,
    "slogan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfoEntreprise_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "Produits" ADD CONSTRAINT "Produits_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandesProduits" ADD CONSTRAINT "CommandesProduits_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandesProduits" ADD CONSTRAINT "CommandesProduits_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commandes" ADD CONSTRAINT "Commandes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchatsCommandes" ADD CONSTRAINT "AchatsCommandes_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchatsCommandes" ADD CONSTRAINT "AchatsCommandes_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Articls" ADD CONSTRAINT "Articls_deviId_fkey" FOREIGN KEY ("deviId") REFERENCES "Devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
