/*
  Warnings:

  - A unique constraint covering the columns `[telephone]` on the table `Clients` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Clients_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "Clients_telephone_key" ON "Clients"("telephone");
