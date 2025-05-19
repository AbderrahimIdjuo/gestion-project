import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { deleteTransactionById } from "../../../../lib/deleteTransaction";

export async function DELETE(_, { params }) {
  const id = params.id;

  const [commandeClient, produits, commandes] = await Promise.all([
    await prisma.commandes.findUnique({
      where: {
        id,
      },
    }),
    // Récupérer les produits associés à la commande client
    await prisma.commandesProduits.findMany({
      where: {
        commandeId: id,
      },
    }),
    // Récupérer les commandes achats liés à cette commande
    await prisma.achatsCommandes.findMany({
      where: {
        commandeId: id,
      },
    }),
  ]);

  const transactions = await prisma.transactions.findMany({
    where: {
      reference: commandeClient.numero,
    },
  });
  console.log("transactions", transactions);

  const comparaison = produits.map((item1) => {
    const item2 = commandes.find((item) => item.produitId === item1.produitId);
    const produitsQuantite = item1.quantite;
    const commandesQuantite = item2 ? item2.quantite : 0;
    let conclusion = "";

    if (commandesQuantite === 0) {
      conclusion = "Le stock est plein";
      return {
        produitId: item1.produitId,
        produits: produitsQuantite,
        commandes: commandesQuantite,
        difference: produitsQuantite,
        conclusion,
        update: prisma.produits.update({
          where: { id: item1.produitId },
          data: { stock: { increment: produitsQuantite } },
        }),
      };
    } else if (produitsQuantite > commandesQuantite) {
      conclusion = `Le stock contient ${produitsQuantite - commandesQuantite}`;
      return {
        produitId: item1.produitId,
        produits: produitsQuantite,
        commandes: commandesQuantite,
        difference: produitsQuantite - commandesQuantite,
        conclusion,
        update: prisma.produits.update({
          where: { id: item1.produitId },
          data: { stock: { increment: produitsQuantite - commandesQuantite } },
        }),
      };
    } else if (produitsQuantite === commandesQuantite) {
      conclusion = "Le stock est vide";
      return {
        produitId: item1.produitId,
        produits: produitsQuantite,
        commandes: commandesQuantite,
        difference: 0,
        conclusion,
        update: null, // Pas besoin de mise à jour
      };
    }
  });

  // Filtrer les mises à jour nulles et exécuter la transaction
  const updates = comparaison.map((item) => item.update).filter(Boolean);
  const transactionResult = await prisma.$transaction(updates);
  const operations = await prisma.$transaction(async (prisma) => {
    // delete the commande
    await prisma.commandes.delete({
      where: { id },
    });

    // Changer le statut du devi "Accepté" une fois la commande est créer
    await prisma.devis.update({
      where: {
        numero: `DEV-${commandeClient.numero.slice(4, 13)}`,
      },
      data: {
        statut: "En attente",
      },
    });
    // Supprimer les transactions liée a la commande
    transactions.map(async (item) => {
      await deleteTransactionById(item);
    });
  });

  return NextResponse.json({ transactionResult, operations });
}

export async function GET(_, { params }) {
  const id = params.id;
  const commande = await prisma.commandes.findUnique({
    where: { id },
    include: {
      client: true,
      commandeProduits: {
        include: {
          produit: true,
        },
      },
    },
  });
  return NextResponse.json({ commande });
}
