import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

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
  // Type filter (supports multiple values separated by "-")
  if (type && type !== "all") {
    const typeArray = type.split("-");
    if (typeArray.length > 0) {
      filters.type = { in: typeArray };
    }
  }

  // Compte filter (supports multiple values separated by "-")
  if (compte && compte !== "all") {
    const compteArray = compte.split("-");
    if (compteArray.length > 0) {
      filters.compte = { in: compteArray };
    }
  }

  // Methode de paiement filter (supports multiple values separated by "-")
  if (methodePaiement && methodePaiement !== "all") {
    const methodePaiementArray = methodePaiement.split("-");
    if (methodePaiementArray.length > 0) {
      filters.methodePaiement = { in: methodePaiementArray };
    }
  }

  // type de depense filter (supports multiple values separated by "-", including sansType for null)
  if (typeDepense && typeDepense !== "all") {
    if (typeDepense === "charges") {
      filters.typeDepense = {
        in: ["fixe", "variante"],
      };
    } else {
      const typeDepenseArray = typeDepense.split("-").filter(Boolean);
      const hasSansType = typeDepenseArray.includes("sansType");
      const stringTypes = typeDepenseArray.filter(t => t !== "sansType");

      if (hasSansType && stringTypes.length > 0) {
        filters.AND = [
          ...(filters.AND || []),
          {
            OR: [
              { typeDepense: { in: stringTypes } },
              { typeDepense: null },
            ],
          },
        ];
      } else if (hasSansType) {
        filters.typeDepense = null;
      } else if (stringTypes.length === 1) {
        filters.typeDepense = stringTypes[0];
      } else if (stringTypes.length > 1) {
        filters.typeDepense = { in: stringTypes };
      }
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
    // Seul admin peut supprimer
    await requireAdmin();

    // Récupérer la transaction à supprimer
    const deletedTransaction = await prisma.transactions.findUnique({
      where: { id },
      include: {
        cheque: true,
        reglement: {
          include: {
            blAllocations: { orderBy: { id: "asc" } },
          },
        },
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

    if (error?.message?.includes("Access denied")) {
      return NextResponse.json(
        { error: "Accès refusé. Rôle admin requis." },
        { status: 403 }
      );
    }

    if (error?.message?.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la suppression de la transaction" },
      { status: 500 }
    );
  }
}

function statutPaiementFromTotal(totalPaye, total) {
  if (totalPaye <= 0) return "impaye";
  if (totalPaye < total) return "enPartie";
  return "paye";
}

async function reverseBonLivraisonPaiement(tx, blId, montant) {
  const bl = await tx.bonLivraison.findUnique({ where: { id: blId } });
  if (!bl) return;

  const nouveauTotalPaye = Math.max(0, (bl.totalPaye ?? 0) - montant);
  await tx.bonLivraison.update({
    where: { id: blId },
    data: {
      totalPaye: nouveauTotalPaye,
      statutPaiement: statutPaiementFromTotal(nouveauTotalPaye, bl.total),
    },
  });
}

async function reversePaiementFournisseur(tx, transaction) {
  const { reference, montant, fournisseurId, ReglementId, reglement } =
    transaction;

  let linkedReglement = reglement ?? null;
  if (!linkedReglement) {
    const reglementId = ReglementId || reference;
    if (reglementId) {
      linkedReglement = await tx.reglement.findUnique({
        where: { id: reglementId },
        include: { blAllocations: { orderBy: { id: "asc" } } },
      });
    }
  }

  if (linkedReglement) {
    if (linkedReglement.blAllocations?.length > 0) {
      for (const alloc of linkedReglement.blAllocations) {
        await reverseBonLivraisonPaiement(
          tx,
          alloc.bonLivraisonId,
          alloc.montant
        );
      }
    } else if (linkedReglement.reference) {
      await reverseBonLivraisonPaiement(
        tx,
        linkedReglement.reference,
        linkedReglement.montant
      );
    }

    if (
      linkedReglement.statusPrelevement === "confirme" &&
      linkedReglement.fournisseurId
    ) {
      await tx.fournisseurs.update({
        where: { id: linkedReglement.fournisseurId },
        data: { dette: { increment: linkedReglement.montant } },
      });
    }

    const chequeId = linkedReglement.chequeId;
    await tx.reglement.delete({ where: { id: linkedReglement.id } });
    if (chequeId) {
      await tx.cheques.delete({ where: { id: chequeId } }).catch(() => {});
    }
    return;
  }

  // Ancien format : reference = fournisseurId, sans règlement lié
  const cibleFournisseurId = fournisseurId || reference;
  if (!cibleFournisseurId) return;

  const bonLivraisonList = await tx.bonLivraison.findMany({
    where: {
      fournisseurId: cibleFournisseurId,
      statutPaiement: { in: ["paye", "enPartie"] },
      type: "achats",
    },
    orderBy: { date: "desc" },
  });

  let montantRestant = montant;
  for (const bl of bonLivraisonList) {
    if (montantRestant <= 0) break;

    const montantPayeSurCeBL = bl.totalPaye ?? 0;
    if (montantRestant >= montantPayeSurCeBL) {
      montantRestant -= montantPayeSurCeBL;
      await tx.bonLivraison.update({
        where: { id: bl.id },
        data: {
          totalPaye: 0,
          statutPaiement: "impaye",
        },
      });
    } else {
      const nouveauTotalPaye = montantPayeSurCeBL - montantRestant;
      await tx.bonLivraison.update({
        where: { id: bl.id },
        data: {
          totalPaye: nouveauTotalPaye,
          statutPaiement: statutPaiementFromTotal(nouveauTotalPaye, bl.total),
        },
      });
      montantRestant = 0;
    }
  }

  if (fournisseurId) {
    await tx.fournisseurs.update({
      where: { id: fournisseurId },
      data: { dette: { increment: montant } },
    });
  }
}

// Fonction helper pour gérer les labels spéciaux
async function handleSpecialLabels(tx, transaction) {
  const { lable, reference, montant, date, compte } = transaction;

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
      include: {
        client: {
          select: {
            nom: true,
          },
        },
      },
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

      // Supprimer le versement associé si un versement existe pour ce paiement
      // Le versement a été créé avec note: "paiement devis" et reference: nom du client
      if (devis.client) {
        // Chercher le versement associé avec plusieurs critères pour être plus flexible
        const versement = await tx.versement.findFirst({
          where: {
            note: "paiement devis",
            reference: devis.client.nom,
            montant: montant,
            date: {
              gte: new Date(new Date(date).getTime() - 7 * 24 * 60 * 60 * 1000), // 7 jours avant
              lte: new Date(new Date(date).getTime() + 7 * 24 * 60 * 60 * 1000), // 7 jours après
            },
          },
          orderBy: {
            date: "desc", // Prendre le plus récent si plusieurs correspondances
          },
        });

        if (versement) {
          // Restaurer les soldes des comptes seulement si le compte source existe
          if (versement.sourceCompteId) {
            await tx.comptesBancaires.update({
              where: { id: versement.sourceCompteId },
              data: {
                solde: {
                  increment: versement.montant,
                },
              },
            });
          }

          // Restaurer le solde du compte pro
          await tx.comptesBancaires.update({
            where: { id: versement.compteProId },
            data: {
              solde: {
                decrement: versement.montant,
              },
            },
          });

          // Supprimer le versement
          await tx.versement.delete({
            where: { id: versement.id },
          });
        }
      }
    }
  }

  // Paiement fournisseur — résoudre via ReglementId / reference (id règlement), pas fournisseurId
  if (lable === "paiement fournisseur") {
    await reversePaiementFournisseur(tx, transaction);
  }
}
