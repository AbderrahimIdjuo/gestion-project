/*
  Warnings:

  - You are about to drop the column `Key` on the `Articls` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `Articls` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `Articls` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Articls_Key_key";

-- AlterTable
ALTER TABLE "Articls" DROP COLUMN "Key",
ADD COLUMN     "key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Articls_key_key" ON "Articls"("key");
