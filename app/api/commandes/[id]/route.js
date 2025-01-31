import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function DELETE(_, { params }) {
  const id = params.id;
  // Récupérer les produits associés à la commande client
  const produits = await prisma.commandesProduits.findMany({
    where: {
      commandeId: id,
    },
  });
  // Récupérer les commande achats liés à cette commande
  const commandes = await prisma.achatsCommandes.findMany({
    where: {
      commandeId: id,
    },
  });
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
  const commande = await prisma.commandes.delete({
    where: { id },
  });
  return NextResponse.json({ transactionResult, commande });
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
