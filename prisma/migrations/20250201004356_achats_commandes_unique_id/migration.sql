/*
  Warnings:

  - A unique constraint covering the columns `[commandeId,produitId]` on the table `AchatsCommandes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AchatsCommandes_commandeId_produitId_key" ON "AchatsCommandes"("commandeId", "produitId");
