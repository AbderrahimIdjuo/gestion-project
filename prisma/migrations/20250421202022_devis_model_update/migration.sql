/*
  Warnings:

  - You are about to drop the column `fraisLivraison` on the `Devis` table. All the data in the column will be lost.
  - Added the required column `lenght` to the `Articls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tva` to the `Devis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Articls" ADD COLUMN     "lenght" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "width" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Devis" DROP COLUMN "fraisLivraison",
ADD COLUMN     "tva" DOUBLE PRECISION NOT NULL;
