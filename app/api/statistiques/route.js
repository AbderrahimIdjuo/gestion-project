import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
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
    filters.createdAt = {
      gte: fromDate, // Greater than or equal to "from"
      lte: toDate, // Less than or equal to "to"
    };
  }
  const [
    nbrClients,
    nbrFournisseurs,
    nbrProduits,
    nbrCommandes,
    transactionsRecettes,
    transactionsDepense,
    comptabilite
  ] = await Promise.all([
    prisma.clients.count(),
    prisma.fournisseurs.count(),
    prisma.produits.count(),
    prisma.commandes.count(),
    prisma.transactions.findMany({
      where: {
        type: "recette",
        createdAt: filters.createdAt,
      },
    }),
    prisma.transactions.findMany({
      where: {
        type: "depense",
        createdAt: filters.createdAt,
      },
    }),
    prisma.comptabilite.findFirst(),
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
    recettes,
    depenses,
    caisse : comptabilite.caisse,
  });
}
