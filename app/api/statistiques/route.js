import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  console.log("from", from, "to", to);

  const fromDate = new Date(from);
  const toDate = new Date(to);
  // Subtract one day from 'fromDate'
  fromDate.setDate(fromDate.getDate() - 1);

  // Add one day to 'toDate'
  toDate.setDate(toDate.getDate() + 1);

  //   const currentDate = new Date(); // Get the current date

  // fromDate.setMonth(currentDate.getMonth() - 3);

  const filters = {};
  // filters.createdAt={
  //   gte: currentDate.setMonth(currentDate.getMonth() - 3), // Greater than or equal to "from"
  //   lte: new Date(), // Less than or equal to "to"

  // }
  if (from && to) {
    filters.date = {
      gte: from, // Greater than or equal to "from"
      lte: to, // Less than or equal to "to"
    };
  }
  const [
    nbrClients,
    nbrFournisseurs,
    nbrProduits,
    nbrCommandes,
    nbrBonLivraison,
    transactionsRecettes,
    transactionsDepense,
    caisse,
    comptePersonnel,
    compteProfessionnel,
  ] = await Promise.all([
    prisma.clients.count(),
    prisma.fournisseurs.count(),
    prisma.produits.count(),
    prisma.commandeFourniture.count({
      where: {
        date: filters.date,
      },
    }),
    prisma.bonLivraison.count({
      where: {
        date: filters.date,
      },
    }),
    prisma.transactions.findMany({
      where: {
        type: "recette",
        date: filters.date,
      },
    }),
    prisma.transactions.findMany({
      where: {
        type: "depense",
        date: filters.date,
      },
    }),
    prisma.comptesBancaires.findFirst({
      where: {
        compte: "caisse",
      },
    }),
    prisma.comptesBancaires.findFirst({
      where: {
        compte: "compte personnel",
      },
    }),
    prisma.comptesBancaires.findFirst({
      where: {
        compte: "compte professionnel",
      },
    }),
  ]);

  const recettes = transactionsRecettes.reduce(
    (acc, trans) => acc + trans.montant,
    0
  );
  const depenses = transactionsDepense.reduce(
    (acc, trans) => acc + trans.montant,
    0
  );
  return NextResponse.json({
    nbrClients,
    nbrFournisseurs,
    nbrProduits,
    nbrCommandes,
    nbrBonLivraison,
    recettes,
    depenses,
    caisse: caisse?.solde,
    comptePersonnel: comptePersonnel?.solde,
    compteProfessionnel: compteProfessionnel?.solde,
  });
}
