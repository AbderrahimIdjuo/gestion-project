import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("query") || "";
  const compte = searchParams.get("compte") || "all";
  const type = searchParams.get("type") || "all";
  const numeroCommande = searchParams.get("numeroCommande");
  const from = searchParams.get("from"); // Start date
  const to = searchParams.get("to"); // End date
  const transactionsPerPage = 10;
  const filters = {};

  // Search filter
  if (searchQuery) {
    filters.reference = {
      contains: searchQuery,
    };
  }

  // Type filter
  if (type !== "all") {
    filters.type = type; // Filters by "depense" or "recette"
  }

  // Type filter
  if (compte !== "all") {
    filters.compte = compte; // Filters by "depense" or "recette"
  }

  // Date range filter
  if (from && to) {
    filters.createdAt = {
      gte: new Date(from), // Greater than or equal to "from"
      lte: new Date(to), // Less than or equal to "to"
    };
  }

  // Numero filter
  if (numeroCommande) {
    filters.reference = numeroCommande; // Filters by "depense" or "recette"
  }
  // Fetch filtered transactions with pagination
  const transactions = await prisma.transactions.findMany({
    where: filters,
    skip: (page - 1) * transactionsPerPage,
    take: transactionsPerPage,
    orderBy: { updatedAt: "desc" },
  });

  const totalTransactions = await prisma.transactions.count({ where: filters });
  const totalPages = Math.ceil(totalTransactions / transactionsPerPage);

  return NextResponse.json({ transactions, totalPages });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const deletedTransaction = await prisma.transactions.findUnique({
    where: { id },
  });
  const result = await prisma.$transaction(async (prisma) => {
    await prisma.transactions.delete({
      where: { id },
    });

    await prisma.commandes.update({
      where: { numero: deletedTransaction.reference },
      data: {
        totalPaye: {
          decrement: deletedTransaction.montant,
        },
      },
    });
  });
  return NextResponse.json({ result });
}
