/*
  Warnings:

  - A unique constraint covering the columns `[numero]` on the table `DepensesVariantes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DepensesVariantes_numero_key" ON "DepensesVariantes"("numero");
