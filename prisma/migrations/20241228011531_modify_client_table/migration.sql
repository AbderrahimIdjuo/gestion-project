/*
  Warnings:

  - You are about to drop the column `address` on the `Clients` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Clients` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Clients` table. All the data in the column will be lost.
  - Added the required column `adresse` to the `Clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nom` to the `Clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telephone` to the `Clients` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Clients" ("createdAt", "email", "id", "updatedAt") SELECT "createdAt", "email", "id", "updatedAt" FROM "Clients";
DROP TABLE "Clients";
ALTER TABLE "new_Clients" RENAME TO "Clients";
CREATE UNIQUE INDEX "Clients_email_key" ON "Clients"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
