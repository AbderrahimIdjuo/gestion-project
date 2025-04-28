/*
  Warnings:

  - You are about to drop the column `length` on the `Produits` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `Produits` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Produits" DROP COLUMN "length",
DROP COLUMN "width";
