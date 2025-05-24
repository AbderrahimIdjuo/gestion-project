/*
  Warnings:

  - You are about to drop the column `groupId` on the `CommandeFourniture` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CommandeFourniture" DROP CONSTRAINT "CommandeFourniture_groupId_fkey";

-- AlterTable
ALTER TABLE "CommandeFourniture" DROP COLUMN "groupId";

-- AlterTable
ALTER TABLE "OrdersGroups" ADD COLUMN     "commandeFournitureId" TEXT;

-- AddForeignKey
ALTER TABLE "OrdersGroups" ADD CONSTRAINT "OrdersGroups_commandeFournitureId_fkey" FOREIGN KEY ("commandeFournitureId") REFERENCES "CommandeFourniture"("id") ON DELETE SET NULL ON UPDATE CASCADE;
