"use server";
import prisma from "../../lib/prisma";

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

export async function deleteCategorieProduits(id) {
  const result = await prisma.categoriesProduits.delete({
    where: { id },
  });
  return result;
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
  const { numero, type, montant, compte, lable, description } = data;
  let compteData = {};
  if (type === "vider") {
  compteData = { id: "1", compte: "caisse" };
  } else compteData = JSON.parse(compte);  
  const result = await prisma.$transaction(async (prisma) => {
    await prisma.transactions.create({
      data: {
        reference: numero,
        type,
        montant,
        compte: compteData.compte,
        lable,
        description,
      },
    });

    if (type === "vider") {
      await prisma.comptesBancaires.update({
        where: { id: compteData.id },
        data: {
          solde: { decrement: montant },
        },
      });
    } else if (type === "depense" || type === "recette") {
      // Mise à jour d'un compte bancaire
      await prisma.comptesBancaires.update({
        where: { id: compteData.id },
        data: {
          solde:
            type === "recette"
              ? { increment: montant }
              : { decrement: montant },
        },
      });
    }

    if (numero && numero.slice(0, 3) === "CMD") {
      await prisma.commandes.update({
        where: { numero: numero },
        data: {
          totalPaye: { increment: montant },
        },
      });
    }
  });

  return { result };
}
