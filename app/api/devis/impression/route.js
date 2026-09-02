import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get("query") || "";
  const statut = searchParams.get("statut");
  const from = searchParams.get("from"); // Start date
  const to = searchParams.get("to"); // End date
  const dateStartFrom = searchParams.get("dateStartFrom");
  const dateStartTo = searchParams.get("dateStartTo");
  const dateEndFrom = searchParams.get("dateEndFrom");
  const dateEndTo = searchParams.get("dateEndTo");
  const minTotal = searchParams.get("minTotal");
  const maxTotal = searchParams.get("maxTotal");
  const statutPaiement = searchParams.get("statutPaiement");
  const commercant = searchParams.get("commercant");

  const filters = {};

  // Search filter by numero and client name
  filters.OR = [
    { numero: { contains: searchQuery, mode: "insensitive" } },
    { client: { nom: { contains: searchQuery, mode: "insensitive" } } },
  ];

  // Statut filter (supports multiple values separated by "-")
  if (statut && statut !== "all") {
    const statutArray = statut.split("-");
    if (statutArray.length > 0) {
      filters.statut = { in: statutArray };
    }
  }

  // StatutPaiement filter (supports multiple values separated by "-")
  if (statutPaiement && statutPaiement !== "all") {
    const statutPaiementArray = statutPaiement.split("-");
    if (statutPaiementArray.length > 0) {
      filters.statutPaiement = { in: statutPaiementArray };
    }
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

  if (dateStartFrom || dateStartTo) {
    filters.dateStart = {};
    if (dateStartFrom) {
      const start = new Date(dateStartFrom);
      start.setHours(0, 0, 0, 0);
      filters.dateStart.gte = start;
    }
    if (dateStartTo) {
      const end = new Date(dateStartTo);
      end.setHours(23, 59, 59, 999);
      filters.dateStart.lte = end;
    }
  }

  if (dateEndFrom || dateEndTo) {
    filters.dateEnd = {};
    if (dateEndFrom) {
      const start = new Date(dateEndFrom);
      start.setHours(0, 0, 0, 0);
      filters.dateEnd.gte = start;
    }
    if (dateEndTo) {
      const end = new Date(dateEndTo);
      end.setHours(23, 59, 59, 999);
      filters.dateEnd.lte = end;
    }
  }

  if (commercant && commercant !== "all") {
    filters.commercant = {
      nom: commercant,
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
