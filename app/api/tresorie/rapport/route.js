import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const compte = searchParams.get("compte") || "all";
  const type = searchParams.get("type") || "all";
  const typeDepense = searchParams.get("typeDepense");
  const from = searchParams.get("from"); // Start date
  const to = searchParams.get("to"); // End date

  const filters = {};

  // Compt filter
  if (compte !== "all") {
    filters.compte = compte;
  }

  // Type filter (ex: depense)
  if (type && type !== "all") {
    filters.type = type;
  }

  // Type de dépense filter (fixe / variante)
  if (typeDepense && typeDepense !== "all") {
    filters.typeDepense = typeDepense;
  }

  // Date range filter
  if (from && to) {
    filters.date = {
      gte: from,
      lte: to,
    };
  }

  const transactions = await prisma.transactions.findMany({
    where: filters,
    orderBy: { date: "asc" },
  });

  const comptes = await prisma.comptesBancaires.findMany();

  return NextResponse.json({ transactions, comptes });
}
