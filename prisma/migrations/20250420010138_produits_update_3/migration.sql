/*
  Warnings:

  - You are about to drop the column `lengthUnit` on the `Produits` table. All the data in the column will be lost.
  - You are about to drop the column `widthUnit` on the `Produits` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Produits" DROP COLUMN "lengthUnit",
DROP COLUMN "widthUnit";
