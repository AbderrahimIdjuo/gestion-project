import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get("query") || "";
  const statut = searchParams.get("statut");
  const from = searchParams.get("from"); // Start date
  const to = searchParams.get("to"); // End date
  const minTotal = searchParams.get("minTotal");
  const maxTotal = searchParams.get("maxTotal");
  const statutPaiement = searchParams.get("statutPaiement");

  const filters = {};

  // Search filter by numero and client name
  filters.OR = [
    { numero: { contains: searchQuery, mode: "insensitive" } },
    { client: { nom: { contains: searchQuery, mode: "insensitive" } } },
  ];

  // Statut filter
  if (statut !== "all") {
    filters.statut = statut;
  }

  // StatutPaiement filter
  if (statutPaiement !== "all") {
    filters.statutPaiement = statutPaiement;
  }

  if (from && to) {
    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0); // Set to beginning of the day

    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999); // Set to end of the day

    filters.date = {
      gte: startDate, // Greater than or equal to start of "from" day
      lte: endDate, // Less than or equal to end of "to" day
    };
  }

  // total range filter
  if (minTotal && maxTotal) {
    filters.total = {
      gte: Number(minTotal),
      lte: Number(maxTotal),
    };
  }

  // Fetch filtered transactions with pagination
  const devis = await prisma.devis.findMany({
    where: filters,
    orderBy: { updatedAt: "desc" },
    include: {
      client: true,
      articls: true,
    },
  });

  // Extract devis numbers for transaction lookup
  const devisNumbers = devis.map(c => c.numero);

  // Fetch transactions for the commandes
  const transactionsList = await prisma.transactions.findMany({
    where: { reference: { in: devisNumbers } },
  });

  // Fetch ordersGroups
  const bLGroupsList = await prisma.bLGroups.findMany({
    where: { devisNumero: { in: devisNumbers } },
    include: {
      bonLivraison: {
        select: {
          date: true,
          numero: true,
          total: true,
          fournisseur: {
            select: {
              nom: true,
            },
          },
          type: true,
        },
      },
      produits: {
        include: {
          produit: {
            select: {
              designation: true,
              prixAchat: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ devis, bLGroupsList });
}
