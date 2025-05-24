-- AlterTable
ALTER TABLE "Articls" ALTER COLUMN "length" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CommandeFourniture" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fournisseurId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandeFourniture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdersGroups" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "commandeNumero" TEXT,

    CONSTRAINT "OrdersGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListProduits" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ListProduits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommandeFourniture_numero_key" ON "CommandeFourniture"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "OrdersGroups_numero_key" ON "OrdersGroups"("numero");

-- AddForeignKey
ALTER TABLE "CommandeFourniture" ADD CONSTRAINT "CommandeFourniture_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeFourniture" ADD CONSTRAINT "CommandeFourniture_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "OrdersGroups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListProduits" ADD CONSTRAINT "ListProduits_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "OrdersGroups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListProduits" ADD CONSTRAINT "ListProduits_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
