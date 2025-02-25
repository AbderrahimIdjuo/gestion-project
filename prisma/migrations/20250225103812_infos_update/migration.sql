/*
  Warnings:

  - You are about to drop the column `name` on the `InfoEntreprise` table. All the data in the column will be lost.
  - You are about to drop the column `ville` on the `InfoEntreprise` table. All the data in the column will be lost.
  - Added the required column `nom` to the `InfoEntreprise` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InfoEntreprise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "adresse" TEXT NOT NULL
);
INSERT INTO "new_InfoEntreprise" ("adresse", "email", "id", "telephone") SELECT "adresse", "email", "id", "telephone" FROM "InfoEntreprise";
DROP TABLE "InfoEntreprise";
ALTER TABLE "new_InfoEntreprise" RENAME TO "InfoEntreprise";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
