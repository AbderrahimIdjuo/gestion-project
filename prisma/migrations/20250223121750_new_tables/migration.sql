-- CreateTable
CREATE TABLE "TachesEmployes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tache" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CategoriesProduits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categorie" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ComptesBancaires" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compte" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "InfoEntreprise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "adresse" TEXT NOT NULL,
    "ville" TEXT
);
