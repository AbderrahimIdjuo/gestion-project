/*
  Warnings:

  - The primary key for the `InfoEntreprise` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `InfoEntreprise` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Added the required column `updatedAt` to the `InfoEntreprise` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InfoEntreprise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "adresse" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_InfoEntreprise" ("adresse", "email", "id", "mobile", "nom", "telephone") SELECT "adresse", "email", "id", "mobile", "nom", "telephone" FROM "InfoEntreprise";
DROP TABLE "InfoEntreprise";
ALTER TABLE "new_InfoEntreprise" RENAME TO "InfoEntreprise";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
