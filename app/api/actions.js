"use server";
import prisma from "../../lib/prisma";
import {
  createTresorieTransaction,
  getCreateTransactionErrorMessage,
} from "../../lib/createTransaction";

export async function deleteManyFactures(selectedFactures) {
  const result = await prisma.factures.deleteMany({
    where: {
      id: { in: selectedFactures },
    },
  });
  return result;
}

export async function payeManyFactures(selectedFactures) {
  const result = await prisma.factures.updateMany({
    where: { id: { in: selectedFactures } },
    data: {
      payer: true,
    },
  });
  return result;
}

export async function addCategorieProduits(categorie) {
  if (categorie !== "") {
    const result = await prisma.categoriesProduits.create({
      data: {
        categorie,
      },
    });
    return result;
  }
}

export async function addCharge(charge, type = "fixe") {
  if (charge !== "") {
    try {
      const result = await prisma.charges.create({
        data: {
          charge,
          type: type === "variante" ? "variante" : "fixe",
        },
      });
      return result;
    } catch (error) {
      console.error("addCharge error:", error);
      throw new Error(
        getCreateTransactionErrorMessage(error) ||
          "Échec de l'ajout de la charge"
      );
    }
  }
}

export async function deleteCategorieProduits(id) {
  const result = await prisma.categoriesProduits.delete({
    where: { id },
  });
  return result;
}

export async function updateCategorieProduits(id, categorie) {
  if (categorie !== "" && id) {
    const result = await prisma.categoriesProduits.update({
      where: { id },
      data: {
        categorie,
      },
    });
    return result;
  }
}

export async function addCompteBancaire(compte) {
  if (compte !== "") {
    const result = await prisma.comptesBancaires.create({
      data: {
        compte,
      },
    });
    return result;
  }
}

export async function deleteCompteBancaire(id) {
  const result = await prisma.comptesBancaires.delete({
    where: { id },
  });
  return result;
}

export async function addTacheEmploye(tache) {
  if (tache !== "") {
    const result = await prisma.tachesEmployes.create({
      data: {
        tache,
      },
    });
    return result;
  }
}

export async function deleteTacheEmploye(id) {
  const result = await prisma.tachesEmployes.delete({
    where: { id },
  });
  return result;
}

export async function addModePaiementProduits(modePaiement) {
  if (modePaiement !== "") {
    const result = await prisma.modesPaiement.create({
      data: {
        modePaiement,
      },
    });
    return result;
  }
}

export async function deleteModePaiementProduits(id) {
  const result = await prisma.modesPaiement.delete({
    where: { id },
  });
  return result;
}

export async function addInfoEntreprise(info) {
  const { nom, telephone, mobile, email, adresse, slogan, logoUrl } = info;

  const result = await prisma.infoEntreprise.upsert({
    where: { id: 1 },
    update: { nom, telephone, mobile, email, adresse, slogan, logoUrl },
    create: { id: 1, nom, telephone, mobile, email, adresse, slogan, logoUrl },
  });
  return result;
}

export async function addtransaction(data) {
  try {
    return await createTresorieTransaction(data);
  } catch (error) {
    console.error("addtransaction error:", error);
    return { error: getCreateTransactionErrorMessage(error) };
  }
}
