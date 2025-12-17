import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let page = parseInt(searchParams.get("page") || "1");
    const searchQuery = searchParams.get("query") || "";
    const compte = searchParams.get("compte") || "all";
    const statut = searchParams.get("statut") || "all";
    const methodePaiement = searchParams.get("methodePaiement") || "all";
    const statusPrelevement = searchParams.get("statusPrelevement") || "all";
    const from = searchParams.get("from"); // Start date (dateReglement)
    const to = searchParams.get("to"); // End date (dateReglement)
    const fromPrelevement = searchParams.get("fromPrelevement"); // Start date (datePrelevement)
    const toPrelevement = searchParams.get("toPrelevement"); // End date (datePrelevement)
    const minMontant = searchParams.get("minMontant");
    const maxMontant = searchParams.get("maxMontant");
    const fournisseurId = searchParams.get("fournisseurId");
    const limit = parseInt(searchParams.get("limit") || "10");
    const filters = {};

    // Search filter - recherche dans motif et description du fournisseur
    if (searchQuery) {
      filters.OR = [
        { motif: { contains: searchQuery, mode: "insensitive" } },
        {
          fournisseur: {
            nom: { contains: searchQuery, mode: "insensitive" },
          },
        },
      ];
    }

    // Compte filter
    if (compte !== "all") {
      filters.compte = compte;
    }

    // Statut filter
    if (statut !== "all") {
      filters.statut = statut;
    }

    // Méthode de paiement filter
    if (methodePaiement !== "all") {
      filters.methodePaiement = methodePaiement;
    }

    // Statut de prélèvement filter
    if (statusPrelevement !== "all") {
      if (statusPrelevement === "en_retard") {
        // "en_retard" est un état calculé : datePrelevement < today ET statusPrelevement = "en_attente"
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filters.statusPrelevement = "en_attente";
        filters.datePrelevement = {
          not: null,
          lt: today, // Date de prélèvement est dans le passé
        };
      } else {
        filters.statusPrelevement = statusPrelevement;
        // Si on filtre par "en_attente" et qu'il n'y a pas de filtre de date,
        // exclure les règlements sans date de prélèvement
        if (statusPrelevement === "en_attente") {
          filters.datePrelevement = {
            not: null,
          };
        }
      }
    }

    // Date range filter (sur dateReglement)
    if (from && to) {
      const startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);

      filters.dateReglement = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Date range filter (sur datePrelevement)
    // Note: Si statusPrelevement = "en_retard", on a déjà défini datePrelevement
    if (fromPrelevement && toPrelevement) {
      const startDatePrelevement = new Date(fromPrelevement);
      startDatePrelevement.setHours(0, 0, 0, 0);

      const endDatePrelevement = new Date(toPrelevement);
      endDatePrelevement.setHours(23, 59, 59, 999);

      // Si on a déjà un filtre datePrelevement (pour en_retard), on doit combiner
      if (filters.datePrelevement && statusPrelevement === "en_retard") {
        // Combiner les filtres : datePrelevement < today ET dans la plage sélectionnée
        filters.datePrelevement = {
          ...filters.datePrelevement,
          gte: startDatePrelevement,
          lte: endDatePrelevement,
        };
      } else {
        filters.datePrelevement = {
          gte: startDatePrelevement,
          lte: endDatePrelevement,
        };
      }
    }

    // Montant filter
    if (minMontant || maxMontant) {
      filters.montant = {};
      if (minMontant) {
        filters.montant.gte = parseFloat(minMontant);
      }
      if (maxMontant) {
        filters.montant.lte = parseFloat(maxMontant);
      }
    }

    // Fournisseur filter
    if (fournisseurId) {
      filters.fournisseurId = fournisseurId;
    }

    const skip = (page - 1) * limit;
    const reglementsPerPage = limit;

    // Fetch filtered reglements with pagination
    const reglements = await prisma.reglement.findMany({
      where: filters,
      skip: skip,
      take: limit,
      orderBy: { dateReglement: "desc" },
      include: {
        fournisseur: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
            adresse: true,
            ice: true,
          },
        },
        cheque: {
          select: {
            id: true,
            numero: true,
            dateReglement: true,
            datePrelevement: true,
          },
        },
        factureAchats: {
          select: {
            id: true,
            numero: true,
          },
        },
      },
    });

    const totalReglements = await prisma.reglement.count({ where: filters });
    const totalPages = Math.ceil(totalReglements / reglementsPerPage);

    return NextResponse.json({
      reglements,
      totalPages,
      totalReglements,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des règlements:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des règlements" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, statut, statusPrelevement } = body;

    if (!id) {
      return NextResponse.json({ error: "ID est requis" }, { status: 400 });
    }

    // Si statusPrelevement est fourni, mettre à jour statusPrelevement
    if (statusPrelevement !== undefined) {
      // Vérifier que le statusPrelevement est valide
      const statusPrelevementsValides = [
        "en_attente",
        "confirme",
        "echoue",
        "reporte",
        "refuse",
      ];
      if (!statusPrelevementsValides.includes(statusPrelevement)) {
        return NextResponse.json(
          { error: "Statut de prélèvement invalide" },
          { status: 400 }
        );
      }

      // Utiliser une transaction pour garantir la cohérence
      const result = await prisma.$transaction(async tx => {
        // Récupérer le règlement existant pour connaître l'ancien statut et les infos du compte
        const reglementExistant = await tx.reglement.findUnique({
          where: { id },
        });

        if (!reglementExistant) {
          throw new Error("Règlement non trouvé");
        }

        const ancienStatusPrelevement = reglementExistant.statusPrelevement;
        const nouveauStatusPrelevement = statusPrelevement;

        // Gestion de la mise à jour du solde du compte bancaire et des transactions selon le changement de statut
        // Cas 1: Passage à "confirme" (déduction du montant du compte + création de transaction)
        if (
          nouveauStatusPrelevement === "confirme" &&
          ancienStatusPrelevement !== "confirme"
        ) {
          // Déduire le montant du compte bancaire car le prélèvement est confirmé
          await tx.comptesBancaires.updateMany({
            where: { compte: reglementExistant.compte },
            data: {
              solde: { decrement: reglementExistant.montant },
            },
          });
          const fournisseur = await tx.fournisseurs.findUnique({
            where: { id: reglementExistant.fournisseurId },
            select: { nom: true },
          });
          // Créer une transaction pour enregistrer le prélèvement confirmé
          await tx.transactions.create({
            data: {
              reference: reglementExistant.id,
              type: "depense",
              montant: reglementExistant.montant,
              compte: reglementExistant.compte,
              fournisseurId: reglementExistant.fournisseurId,
              lable: "paiement fournisseur",
              description: "bénéficiaire :" + fournisseur.nom,
              methodePaiement: reglementExistant.methodePaiement,
              date: new Date(),
              motif: reglementExistant.motif || null,
              cheque: reglementExistant.chequeId
                ? {
                    connect: {
                      id: reglementExistant.chequeId,
                    },
                  }
                : undefined,
            },
          });
        }
        // Cas 2: Passage de "confirme" à un autre statut (remboursement dans le compte + suppression de transaction)
        else if (
          ancienStatusPrelevement === "confirme" &&
          nouveauStatusPrelevement !== "confirme"
        ) {
          // Remettre le montant dans le compte bancaire car le prélèvement n'est plus confirmé
          // Le compte doit augmenter de la valeur du règlement
          await tx.comptesBancaires.updateMany({
            where: { compte: reglementExistant.compte },
            data: {
              solde: { increment: reglementExistant.montant },
            },
          });

          // Supprimer la transaction associée au règlement confirmé
          await tx.transactions.deleteMany({
            where: {
              reference: reglementExistant.id,
              type: "depense",
            },
          });
        }

        // Mettre à jour le statusPrelevement du règlement
        const reglement = await tx.reglement.update({
          where: { id },
          data: { statusPrelevement },
        });

        return reglement;
      });

      return NextResponse.json({
        reglement: result,
        message: "Statut de prélèvement mis à jour avec succès",
      });
    }

    // Sinon, si statut est fourni, mettre à jour statut (pour rétrocompatibilité)
    if (statut !== undefined) {
      // Vérifier que le statut est valide
      const statutsValides = ["en_attente", "paye", "en_retard", "annule"];
      if (!statutsValides.includes(statut)) {
        return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
      }

      // Mettre à jour le statut du règlement
      const reglement = await prisma.reglement.update({
        where: { id },
        data: { statut },
      });

      return NextResponse.json({
        reglement,
        message: "Statut mis à jour avec succès",
      });
    }

    return NextResponse.json(
      { error: "statut ou statusPrelevement est requis" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      id,
      montant,
      compte,
      methodePaiement,
      dateReglement,
      datePrelevement,
      motif,
      numeroCheque,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID du règlement requis" },
        { status: 400 }
      );
    }

    // Récupérer le règlement existant
    const reglementExistant = await prisma.reglement.findUnique({
      where: { id },
      include: { cheque: true, fournisseur: true },
    });

    if (!reglementExistant) {
      return NextResponse.json(
        { error: "Règlement non trouvé" },
        { status: 404 }
      );
    }

    // Utiliser une transaction Prisma pour garantir la cohérence
    const result = await prisma.$transaction(async tx => {
      // Gérer le chèque si la méthode de paiement est chèque
      let chequeId = reglementExistant.chequeId;

      if (methodePaiement === "cheque" || methodePaiement === "traite") {
        if (reglementExistant.cheque) {
          // Mettre à jour le chèque existant
          await tx.cheques.update({
            where: { id: reglementExistant.cheque.id },
            data: {
              numero: numeroCheque || reglementExistant.cheque.numero,
              montant: montant || reglementExistant.montant,
              compte: compte || reglementExistant.compte,
              dateReglement: dateReglement
                ? new Date(dateReglement)
                : reglementExistant.dateReglement,
              datePrelevement: datePrelevement
                ? new Date(datePrelevement)
                : reglementExistant.cheque.datePrelevement,
            },
          });
        } else {
          // Créer un nouveau chèque
          const nouveauCheque = await tx.cheques.create({
            data: {
              type: "EMIS",
              montant: montant || reglementExistant.montant,
              compte: compte || reglementExistant.compte,
              numero: numeroCheque,
              fournisseurId: reglementExistant.fournisseurId,
              dateReglement: dateReglement
                ? new Date(dateReglement)
                : reglementExistant.dateReglement,
              datePrelevement: datePrelevement
                ? new Date(datePrelevement)
                : null,
            },
          });
          chequeId = nouveauCheque.id;
        }
      } else {
        // Si on change de chèque à autre chose, supprimer le chèque
        if (reglementExistant.chequeId) {
          await tx.cheques.delete({
            where: { id: reglementExistant.chequeId },
          });
          chequeId = null;
        }
      }

      // Mettre à jour le compte bancaire si le montant ou le compte change
      if (
        montant !== reglementExistant.montant ||
        compte !== reglementExistant.compte
      ) {
        // Remettre l'ancien montant dans l'ancien compte
        await tx.comptesBancaires.updateMany({
          where: { compte: reglementExistant.compte },
          data: {
            solde: { increment: reglementExistant.montant },
          },
        });

        // Déduire le nouveau montant du nouveau compte
        const nouveauCompte = compte || reglementExistant.compte;
        const nouveauMontant = montant || reglementExistant.montant;
        await tx.comptesBancaires.updateMany({
          where: { compte: nouveauCompte },
          data: {
            solde: { decrement: nouveauMontant },
          },
        });
      }

      // Mettre à jour le règlement
      const reglement = await tx.reglement.update({
        where: { id },
        data: {
          montant: montant || reglementExistant.montant,
          compte: compte || reglementExistant.compte,
          methodePaiement: methodePaiement || reglementExistant.methodePaiement,
          dateReglement: dateReglement
            ? new Date(dateReglement)
            : reglementExistant.dateReglement,
          datePrelevement: datePrelevement
            ? new Date(datePrelevement)
            : reglementExistant.datePrelevement,
          motif: motif !== undefined ? motif : reglementExistant.motif,
          chequeId: chequeId,
        },
        include: {
          fournisseur: {
            select: {
              id: true,
              nom: true,
              email: true,
              telephone: true,
              adresse: true,
              ice: true,
            },
          },
          cheque: {
            select: {
              id: true,
              numero: true,
              dateReglement: true,
              datePrelevement: true,
            },
          },
        },
      });

      return {
        success: true,
        message: "Règlement mis à jour avec succès",
        reglement,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du règlement:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du règlement" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID du règlement requis" },
        { status: 400 }
      );
    }

    // Utiliser une transaction Prisma pour garantir la cohérence des données
    const result = await prisma.$transaction(async tx => {
      // Récupérer le règlement avec ses relations
      const reglement = await tx.reglement.findUnique({
        where: { id },
        include: {
          cheque: true,
        },
      });

      if (!reglement) {
        throw new Error("Règlement non trouvé");
      }

      // Remettre l'argent dans le compte bancaire
      await tx.comptesBancaires.updateMany({
        where: { compte: reglement.compte },
        data: {
          solde: { increment: reglement.montant },
        },
      });

      // Supprimer le règlement (le chèque sera supprimé automatiquement grâce au cascade)
      await tx.reglement.delete({
        where: { id },
      });

      return {
        success: true,
        message: "Règlement supprimé avec succès",
        reglement,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de la suppression du règlement:", error);

    if (error.message === "Règlement non trouvé") {
      return NextResponse.json(
        { error: "Règlement non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la suppression du règlement" },
      { status: 500 }
    );
  }
}
