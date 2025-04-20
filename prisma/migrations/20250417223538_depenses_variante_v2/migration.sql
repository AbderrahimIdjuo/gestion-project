/*
  Warnings:

  - You are about to drop the column `numero` on the `DepensesVariantes` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "DepensesVariantes_numero_key";

-- AlterTable
ALTER TABLE "DepensesVariantes" DROP COLUMN "numero";
