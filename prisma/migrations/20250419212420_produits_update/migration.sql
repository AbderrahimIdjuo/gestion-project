/*
  Warnings:

  - Added the required column `length` to the `Produits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Produits" ADD COLUMN     "length" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "width" DOUBLE PRECISION;
