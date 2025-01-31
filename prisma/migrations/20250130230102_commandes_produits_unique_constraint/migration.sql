/*
  Warnings:

  - A unique constraint covering the columns `[commandeId,produitId]` on the table `CommandesProduits` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CommandesProduits_commandeId_produitId_key" ON "CommandesProduits"("commandeId", "produitId");
