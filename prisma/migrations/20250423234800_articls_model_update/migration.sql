/*
  Warnings:

  - A unique constraint covering the columns `[Key]` on the table `Articls` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `Key` to the `Articls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Articls" ADD COLUMN     "Key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Articls_Key_key" ON "Articls"("Key");
