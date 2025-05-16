/*
  Warnings:

  - You are about to drop the column `fournisseurId` on the `Produits` table. All the data in the column will be lost.
  - You are about to drop the column `prixVente` on the `Produits` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Produits" DROP CONSTRAINT "Produits_fournisseurId_fkey";

-- AlterTable
ALTER TABLE "Produits" DROP COLUMN "fournisseurId",
DROP COLUMN "prixVente";
