/*
  Warnings:

  - You are about to drop the column `numero` on the `OrdersGroups` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "OrdersGroups_numero_key";

-- AlterTable
ALTER TABLE "OrdersGroups" DROP COLUMN "numero";
