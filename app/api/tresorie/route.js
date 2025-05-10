import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("query") || "";
  const compte = searchParams.get("compte") || "all";
  const type = searchParams.get("type") || "all";
  const from = searchParams.get("from"); // Start date
  const to = searchParams.get("to"); // End date
  const transactionsPerPage = 10;
  const filters = {};

  // Search filter
  filters.OR = [
    { reference: { contains: searchQuery, mode: "insensitive" } },
    { description: { contains: searchQuery, mode: "insensitive" } },
  ];
  // Type filter
  if (type !== "all") {
    filters.type = type;
  }

  // Compt filter
  if (compte !== "all") {
    filters.compte = compte;
  }

  // Date range filter
  if (from && to) {
    filters.createdAt = {
      gte: new Date(from), // Greater than or equal to "from"
      lte: new Date(to), // Less than or equal to "to"
    };
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
    if (deletedTransaction.reference?.slice(0, 2) === "FV") {
      await prisma.depensesVariantes.delete({
        where: { numero: deletedTransaction.reference },
      });
    } else if (deletedTransaction.reference?.slice(0, 3) === "CMD") {
      await prisma.commandes.update({
        where: { numero: deletedTransaction.reference },
        data: {
          totalPaye: {
            decrement: deletedTransaction.montant,
          },
        },
      });
    } else {
      console.log("Transaction reference not a valid found.");
    }
    if (deletedTransaction.type === "recette") {
      await prisma.comptabilite.update({
        where: { id: 1 },
        data: {
          caisse: { decrement: deletedTransaction.montant },
        },
      });
    } else if (
      deletedTransaction.type === "depense" ||
      deletedTransaction.type === "vider"
    ) {
      await prisma.comptabilite.update({
        where: { id: 1 },
        data: {
          caisse: { increment: deletedTransaction.montant },
        },
      });
    }
  });

  return NextResponse.json({ result });
}
