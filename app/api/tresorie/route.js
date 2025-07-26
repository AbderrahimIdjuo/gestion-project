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
  const fournisseurId = searchParams.get("fournisseurId");
  const methodePaiement = searchParams.get("methodePaiement");
  const imprimer = searchParams.get("imprimer");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;
  const transactionsPerPage = limit;
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

  // methode de paiement filter
  if (methodePaiement !== "all") {
    filters.methodePaiement = methodePaiement;
  }

  // Date range filter
  if (from && to) {
    filters.createdAt = {
      gte: new Date(from), // Greater than or equal to "from"
      lte: new Date(to), // Less than or equal to "to"
    };
  }

  // Fournisseur filter
  console.log("fournisseurId", fournisseurId);
  if (fournisseurId) {
    filters.reference = fournisseurId;
  }
  // Fetch filtered transactions with pagination
  const transactions = await prisma.transactions.findMany({
    where: filters,
    skip: imprimer ? undefined : skip,
    take: imprimer ? undefined : limit,
    orderBy: { updatedAt: "desc" },
  });

  const totalTransactions = await prisma.transactions.count({ where: filters });
  const totalPages = imprimer
    ? 1
    : Math.ceil(totalTransactions / transactionsPerPage);
  console.log("totalPages", totalPages);

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
    if (
      deletedTransaction.reference &&
      deletedTransaction.reference?.slice(0, 2) === "BL"
    ) {
      await prisma.bonLivraison.update({
        where: { numero: deletedTransaction.reference },
        data: {
          totalPaye: {
            decrement: deletedTransaction.montant,
          },
        },
      });
    } else {
      console.log("Transaction reference not found.");
    }

    if (deletedTransaction.type === "vider") {
      await prisma.comptesBancaires.updateMany({
        where: { compte: "caisse" },
        data: {
          solde: { increment: deletedTransaction.montant },
        },
      });
    } else if (
      deletedTransaction.type === "depense" ||
      deletedTransaction.type === "recette"
    ) {
      // Mise à jour d'un compte bancaire
      await prisma.comptesBancaires.updateMany({
        where: { compte: deletedTransaction.compte },
        data: {
          solde:
            deletedTransaction.type === "recette"
              ? { decrement: deletedTransaction.montant }
              : { increment: deletedTransaction.montant },
        },
      });
    }
    if (deletedTransaction.lable === "paiement fournisseur") {
      await prisma.fournisseurs.update({
        where: { id: deletedTransaction.reference },
        data: { dette: { increment: deletedTransaction.montant } },
      });
    }
  });

  return NextResponse.json({ result });
}
