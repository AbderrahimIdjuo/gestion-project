-- DropForeignKey
ALTER TABLE "CommandeFourniture" DROP CONSTRAINT "CommandeFourniture_fournisseurId_fkey";

-- DropForeignKey
ALTER TABLE "ListProduits" DROP CONSTRAINT "ListProduits_groupId_fkey";

-- DropForeignKey
ALTER TABLE "ListProduits" DROP CONSTRAINT "ListProduits_produitId_fkey";

-- DropForeignKey
ALTER TABLE "OrdersGroups" DROP CONSTRAINT "OrdersGroups_commandeFournitureId_fkey";

-- AddForeignKey
ALTER TABLE "CommandeFourniture" ADD CONSTRAINT "CommandeFourniture_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdersGroups" ADD CONSTRAINT "OrdersGroups_commandeFournitureId_fkey" FOREIGN KEY ("commandeFournitureId") REFERENCES "CommandeFourniture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListProduits" ADD CONSTRAINT "ListProduits_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "OrdersGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListProduits" ADD CONSTRAINT "ListProduits_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
