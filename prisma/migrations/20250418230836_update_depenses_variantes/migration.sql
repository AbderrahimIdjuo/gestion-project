/*
  Warnings:

  - Added the required column `numero` to the `DepensesVariantes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DepensesVariantes" ADD COLUMN     "numero" TEXT NOT NULL;
