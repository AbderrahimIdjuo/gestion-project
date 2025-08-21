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
  const typeDepense = searchParams.get("typeDepense");
  const limit = parseInt(searchParams.get("limit") || "10");
  const filters = {};

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

  // type de depense filter
  if (typeDepense !== "all") {
    if (typeDepense !== "charges") {
      filters.typeDepense = typeDepense;
    } else if (typeDepense === "charges") {
      filters.typeDepense = {
        in: ["fixe", "variante"],
      };
    }
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

  // Always fetch BL payment records

  return NextResponse.json({
    transactions,
    totalPages,
  });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID de transaction requis" },
      { status: 400 }
    );
  }

  try {
    // Récupérer la transaction à supprimer
    const deletedTransaction = await prisma.transactions.findUnique({
      where: { id },
      include: {
        cheque: true,
      },
    });

    if (!deletedTransaction) {
      return NextResponse.json(
        { error: "Transaction non trouvée" },
        { status: 404 }
      );
    }

    // Utiliser une transaction Prisma pour garantir la cohérence des données
    const result = await prisma.$transaction(async tx => {
      // Supprimer la transaction
      await tx.transactions.delete({
        where: { id },
      });

      // Gérer les différents types de transactions
      switch (deletedTransaction.type) {
        case "vider":
          // Remettre l'argent dans la caisse
          await tx.comptesBancaires.updateMany({
            where: { compte: "caisse" },
            data: {
              solde: { increment: deletedTransaction.montant },
            },
          });
          break;

        case "recette":
        case "depense":
          // Mettre à jour le solde du compte bancaire
          const increment = deletedTransaction.type === "recette" ? -1 : 1;
          await tx.comptesBancaires.updateMany({
            where: { compte: deletedTransaction.compte },
            data: {
              solde: { increment: increment * deletedTransaction.montant },
            },
          });
          break;
      }

      // Gérer les cas spéciaux selon le label
      if (deletedTransaction.lable) {
        await handleSpecialLabels(tx, deletedTransaction);
      }

      return { success: true, message: "Transaction supprimée avec succès" };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de la suppression de la transaction:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la transaction" },
      { status: 500 }
    );
  }
}

// Fonction helper pour gérer les labels spéciaux
async function handleSpecialLabels(tx, transaction) {
  const { lable, reference, montant } = transaction;

  // Paiement de bon de livraison
  if (lable.includes("paiement de :BL")) {
    const numeroBL = lable.match(/BL-(\d+)/)?.[0];
    if (numeroBL) {
      const bonLivraison = await tx.bonLivraison.update({
        where: { numero: numeroBL },
        data: {
          totalPaye: { decrement: montant },
        },
      });

      // Mettre à jour le statut de paiement
      const newTotalPaye = bonLivraison.totalPaye;
      let newStatutPaiement = "enPartie";

      if (newTotalPaye <= 0) {
        newStatutPaiement = "impaye";
      } else if (newTotalPaye >= bonLivraison.total) {
        newStatutPaiement = "paye";
      }

      await tx.bonLivraison.update({
        where: { numero: numeroBL },
        data: { statutPaiement: newStatutPaiement },
      });
    }
  }

  // Paiement de devis
  if (lable.includes("paiement devis")) {
    const devis = await tx.devis.findUnique({
      where: { numero: reference },
    });

    if (devis) {
      const resteApresSuppression = devis.totalPaye - montant;
      let statutPaiement;

      if (resteApresSuppression <= 0) {
        statutPaiement = "impaye";
      } else if (resteApresSuppression >= devis.total) {
        statutPaiement = "paye";
      } else {
        statutPaiement = "enPartie";
      }

      await tx.devis.update({
        where: { numero: reference },
        data: {
          totalPaye: { decrement: montant },
          statutPaiement,
        },
      });
    }
  }

  // Paiement fournisseur - inverser la logique de création
  if (lable === "paiement fournisseur") {
    // Récupérer les BL payés par ce fournisseur, triés par date décroissante (plus récents d'abord)
    const bonLivraisonList = await tx.bonLivraison.findMany({
      where: {
        fournisseurId: reference,
        statutPaiement: {
          in: ["paye", "enPartie"],
        },
        type: "achats",
      },
      orderBy: {
        date: "desc", // Commencer par les plus récents
      },
    });

    let montantRestant = montant; // Montant à "déduire" des BL

    for (const bl of bonLivraisonList) {
      if (montantRestant <= 0) break; // Plus rien à déduire

      const montantPayeSurCeBL = bl.totalPaye;

      if (montantRestant >= montantPayeSurCeBL) {
        // Déduire entièrement ce BL
        montantRestant -= montantPayeSurCeBL;

        await tx.bonLivraison.update({
          where: { id: bl.id },
          data: {
            totalPaye: 0,
            statutPaiement: "impaye",
          },
        });
      } else {
        // Déduire partiellement ce BL
        const nouveauTotalPaye = montantPayeSurCeBL - montantRestant;

        await tx.bonLivraison.update({
          where: { id: bl.id },
          data: {
            totalPaye: nouveauTotalPaye,
            statutPaiement: nouveauTotalPaye > 0 ? "enPartie" : "impaye",
          },
        });

        montantRestant = 0;
        break;
      }
    }

    // Mettre à jour la dette du fournisseur (commenté pour l'instant)
    // await tx.fournisseurs.update({
    //   where: { id: reference },
    //   data: { dette: { increment: montant } },
    // });
  }
}
