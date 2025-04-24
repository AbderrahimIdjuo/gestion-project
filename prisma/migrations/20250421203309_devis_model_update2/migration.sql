/*
  Warnings:

  - You are about to drop the column `lenght` on the `Articls` table. All the data in the column will be lost.
  - Added the required column `length` to the `Articls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Articls" DROP COLUMN "lenght",
ADD COLUMN     "length" DOUBLE PRECISION NOT NULL;
