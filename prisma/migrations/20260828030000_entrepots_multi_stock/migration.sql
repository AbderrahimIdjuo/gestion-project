-- CreateTable
CREATE TABLE "Entrepots" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entrepots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProduitEntrepot" (
    "id" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "entrepotId" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ProduitEntrepot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransfertsStock" (
    "id" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "entrepotSourceId" TEXT NOT NULL,
    "entrepotDestId" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransfertsStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entrepots_nom_key" ON "Entrepots"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "ProduitEntrepot_produitId_entrepotId_key" ON "ProduitEntrepot"("produitId", "entrepotId");

-- AddForeignKey
ALTER TABLE "ProduitEntrepot" ADD CONSTRAINT "ProduitEntrepot_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduitEntrepot" ADD CONSTRAINT "ProduitEntrepot_entrepotId_fkey" FOREIGN KEY ("entrepotId") REFERENCES "Entrepots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransfertsStock" ADD CONSTRAINT "TransfertsStock_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransfertsStock" ADD CONSTRAINT "TransfertsStock_entrepotSourceId_fkey" FOREIGN KEY ("entrepotSourceId") REFERENCES "Entrepots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransfertsStock" ADD CONSTRAINT "TransfertsStock_entrepotDestId_fkey" FOREIGN KEY ("entrepotDestId") REFERENCES "Entrepots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "BonLivraison" ADD COLUMN "entrepotId" TEXT;

-- AddForeignKey
ALTER TABLE "BonLivraison" ADD CONSTRAINT "BonLivraison_entrepotId_fkey" FOREIGN KEY ("entrepotId") REFERENCES "Entrepots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default warehouse and migrate existing product stock
INSERT INTO "Entrepots" ("id", "nom", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Entrepôt principal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ProduitEntrepot" ("id", "produitId", "entrepotId", "quantite")
SELECT gen_random_uuid()::text, p."id", e."id", COALESCE(p."stock", 0)
FROM "Produits" p
CROSS JOIN "Entrepots" e
WHERE e."nom" = 'Entrepôt principal'
  AND COALESCE(p."stock", 0) > 0;
