import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  let page = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("query") || "";
  const compte = searchParams.get("compte") || "all";
  const type = searchParams.get("type") || "all";
  const from = searchParams.get("from"); // Start date
  const to = searchParams.get("to"); // End date
  const fournisseurId = searchParams.get("fournisseurId");
  const methodePaiement = searchParams.get("methodePaiement");
  const limit = parseInt(searchParams.get("limit") || "10");
  const filters = {};

  console.log("transaction rout , from", from, "to", to);

  // Search filter
  filters.OR = [
    { reference: { contains: searchQuery, mode: "insensitive" } },
    { description: { contains: searchQuery, mode: "insensitive" } },
    { lable: { contains: searchQuery, mode: "insensitive" } },
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
    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0); // Set to beginning of the day

    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999); // Set to end of the day

    filters.date = {
      gte: startDate, // Greater than or equal to start of "from" day
      lte: endDate, // Less than or equal to end of "to" day
    };
  }
  // Fournisseur filter
  if (fournisseurId) {
    filters.reference = fournisseurId;
  }

  const skip = (page - 1) * limit;
  const transactionsPerPage = limit;
  // Fetch filtered transactions with pagination
  const transactions = await prisma.transactions.findMany({
    where: filters,
    skip: skip,
    take: limit,
    orderBy: { date: "desc" },
    include: {
      cheque: true,
    },
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
    if (deletedTransaction.lable.includes("paiement de :BL")) {
      console.log("deletedTransaction Label", deletedTransaction.lable);
      const numeroBL = deletedTransaction.lable.match(/BL-(\d+)/);
      console.log("numeroBL", numeroBL[0]);

      const bonLivraison = await prisma.bonLivraison.update({
        where: { numero: numeroBL[0] },
        data: { totalPaye: { decrement: deletedTransaction.montant } },
      });

      if (bonLivraison.totalPaye === 0) {
        await prisma.bonLivraison.update({
          where: { id: bonLivraison.id },
          data: { statutPaiement: "impaye" },
        });
      } else if (
        bonLivraison.totalPaye < bonLivraison.total &&
        bonLivraison.totalPaye > 0
      ) {
        await prisma.bonLivraison.update({
          where: { id: bonLivraison.id },
          data: { statutPaiement: "enPartie" },
        });
      }

      // mise à jour de la dette du fournisseur
      // await prisma.fournisseurs.update({
      //   where: { id: deletedTransaction.reference },
      //   data: {
      //     dette: { increment: deletedTransaction.montant },
      //   },
      // });
    }

    if (deletedTransaction.lable.includes("paiement devis")) {
      const devis = await prisma.devis.findUnique({
        where: { numero: deletedTransaction.reference },
      });
      const resteApresSuppression =
        devis.totalPaye - deletedTransaction.montant;

      let statutPaiement;
      if (resteApresSuppression === 0) {
        statutPaiement = "impaye";
      } else {
        const diff = devis.total - resteApresSuppression;
        statutPaiement = diff === 0 ? "paye" : diff > 0 ? "enPartie" : "impaye";
      }

      //mise a jour du totlaPye te le statutPaiement du devis
      await prisma.devis.update({
        where: { numero: deletedTransaction.reference },
        data: {
          totalPaye: { decrement: deletedTransaction.montant },
          statutPaiement,
        },
      });
      // mise à jour de la dette du client
      await prisma.clients.update({
        where: { id: deletedTransaction.clientId },
        data: {
          dette: { increment: deletedTransaction.montant },
        },
      });

      console.log(
        "update of clietn debt for payment of devis",
        deletedTransaction.clientId,
        deletedTransaction.montant
      );
    }
  });

  return NextResponse.json({ result });
}
