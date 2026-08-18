import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { isCompteCaisse, isCompteProfessionnel } from "@/lib/functions";

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

  let transactions;

  if (isCompteProfessionnel(compte)) {
    const [accountTransactions, transfers] = await Promise.all([
      prisma.transactions.findMany({
        where: filters,
        orderBy: { date: "asc" },
      }),
      prisma.transactions.findMany({
        where: {
          type: "transfert",
          ...(filters.date ? { date: filters.date } : {}),
        },
        orderBy: { date: "asc" },
      }),
    ]);

    const ids = new Set(accountTransactions.map(t => t.id));
    transactions = [
      ...accountTransactions,
      ...transfers.filter(t => !ids.has(t.id)),
    ];
  } else if (isCompteCaisse(compte)) {
    const includeAllVider = !filters.type || filters.type === "vider";
    const [accountTransactions, viders] = await Promise.all([
      prisma.transactions.findMany({
        where: filters,
        orderBy: { date: "asc" },
      }),
      includeAllVider
        ? prisma.transactions.findMany({
            where: {
              type: "vider",
              ...(filters.date ? { date: filters.date } : {}),
            },
            orderBy: { date: "asc" },
          })
        : Promise.resolve([]),
    ]);

    const ids = new Set(accountTransactions.map(t => t.id));
    transactions = [
      ...accountTransactions,
      ...viders.filter(t => !ids.has(t.id)),
    ];
  } else {
    transactions = await prisma.transactions.findMany({
      where: filters,
      orderBy: { date: "asc" },
    });
  }

  const comptes = await prisma.comptesBancaires.findMany();

  return NextResponse.json({ transactions, comptes });
}
