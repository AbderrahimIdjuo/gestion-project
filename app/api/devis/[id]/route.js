import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

const PAIEMENT_DEVIS_VERSEMENT_NOTE = "paiement devis";
const VERSEMENT_DATE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function refundTransactionOnCompte(tx, t) {
  if (!t?.compte || !t?.montant) return Promise.resolve();
  if (t.type === "depense") {
    return tx.comptesBancaires.updateMany({
      where: { compte: t.compte },
      data: { solde: { increment: t.montant } },
    });
  }
  if (t.type === "recette") {
    return tx.comptesBancaires.updateMany({
      where: { compte: t.compte },
      data: { solde: { decrement: t.montant } },
    });
  }
  return Promise.resolve();
}

/**
 * Paiement devis sur compte pro crée un versement (sourceCompteId null)
 * dont le solde a déjà été appliqué via la transaction. On le supprime
 * sans toucher le solde une seconde fois.
 */
async function deleteMatchingPaiementDevisVersement(
  tx,
  { clientNom, montant, date, excludeIds }
) {
  if (!clientNom || !montant) return null;

  const dateFilter = date
    ? {
        date: {
          gte: new Date(new Date(date).getTime() - VERSEMENT_DATE_WINDOW_MS),
          lte: new Date(new Date(date).getTime() + VERSEMENT_DATE_WINDOW_MS),
        },
      }
    : {};

  const versement = await tx.versement.findFirst({
    where: {
      note: PAIEMENT_DEVIS_VERSEMENT_NOTE,
      reference: clientNom,
      montant,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      ...dateFilter,
    },
    orderBy: { date: "desc" },
  });

  if (!versement) return null;

  await tx.versement.delete({ where: { id: versement.id } });
  return versement.id;
}

export async function DELETE(_, { params }) {
  try {
    await requireAdmin();
  } catch (error) {
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
    throw error;
  }

  const id = params.id;

  try {
    const result = await prisma.$transaction(
      async tx => {
        const existing = await tx.devis.findUnique({
          where: { id },
          include: {
            client: { select: { nom: true } },
          },
        });

        if (!existing) {
          throw new Error("Devis non trouvé");
        }

        const statut = existing.statut;
        if (statut === "Accepté" || statut === "Terminer") {
          const err = new Error(
            "Impossible de supprimer un devis accepté ou terminé"
          );
          err.code = "STATUT_NON_SUPPRIMABLE";
          throw err;
        }

        const linkedTransactions = await tx.transactions.findMany({
          where: { reference: existing.numero },
        });

        const isTerminer = existing.statut === "Terminer";
        const usedVersementIds = [];

        for (const t of linkedTransactions) {
          // Devis terminé : on conserve les soldes (paiements déjà encaissés)
          if (!isTerminer) {
            await refundTransactionOnCompte(tx, t);
          }

          const versementId = await deleteMatchingPaiementDevisVersement(tx, {
            clientNom: existing.client?.nom,
            montant: t.montant,
            date: t.date,
            excludeIds: usedVersementIds,
          });
          if (versementId) {
            usedVersementIds.push(versementId);
          }
        }

        const chequeIds = linkedTransactions
          .map(t => t.chequeId)
          .filter(Boolean);

        if (linkedTransactions.length > 0) {
          await tx.transactions.deleteMany({
            where: { reference: existing.numero },
          });
        }

        if (chequeIds.length > 0) {
          await tx.cheques.deleteMany({
            where: { id: { in: chequeIds } },
          });
        }

        return tx.devis.delete({ where: { id } });
      },
      { timeout: 60_000 }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting devis:", error);
    if (error?.message === "Devis non trouvé") {
      return NextResponse.json(
        { error: "Devis non trouvé" },
        { status: 404 }
      );
    }
    if (
      error?.code === "STATUT_NON_SUPPRIMABLE" ||
      error?.message === "Impossible de supprimer un devis accepté ou terminé"
    ) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer un devis accepté ou terminé. Seuls les devis en attente ou annulés peuvent être supprimés.",
        },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la suppression du devis" },
      { status: 500 }
    );
  }
}

export async function GET(_, { params }) {
  const id = params.id;
  const devi = await prisma.devis.findUnique({
    where: { id },
    include: {
      client: true,
      articls: true,
      commercant: true,
    },
  });
  return NextResponse.json({ devi });
}

function parseDateEnd(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00.000Z`);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function PATCH(req, { params }) {
  try {
    const id = params.id;
    const { statut, dateEnd } = await req.json();

    // Récupérer le devis actuel pour connaître son statut
    const currentDevi = await prisma.devis.findUnique({
      where: { id },
      select: { statut: true, statutPaiement: true, dateStart: true },
    });

    if (!currentDevi) {
      return NextResponse.json(
        { error: "Devis non trouvé" },
        { status: 404 }
      );
    }

    // Mise à jour de la date de fin uniquement (devis déjà terminé)
    if (dateEnd !== undefined && statut === undefined) {
      if (currentDevi.statut !== "Terminer") {
        return NextResponse.json(
          {
            error:
              "La date de fin ne peut être modifiée que pour un devis terminé.",
          },
          { status: 403 }
        );
      }

      const parsedDateEnd = parseDateEnd(dateEnd);
      if (!parsedDateEnd) {
        return NextResponse.json(
          { error: "La date de fin est invalide." },
          { status: 400 }
        );
      }

      const startDay = currentDevi.dateStart
        ? new Date(currentDevi.dateStart).toISOString().slice(0, 10)
        : null;
      const endDay = parsedDateEnd.toISOString().slice(0, 10);
      if (startDay && endDay < startDay) {
        return NextResponse.json(
          {
            error:
              "La date de fin ne peut pas être antérieure à la date de début.",
          },
          { status: 400 }
        );
      }

      const devi = await prisma.devis.update({
        where: { id },
        data: { dateEnd: parsedDateEnd },
      });

      return NextResponse.json({ devi });
    }

    if (!statut) {
      return NextResponse.json(
        { error: "Le statut est requis." },
        { status: 400 }
      );
    }

    const fromLocked =
      currentDevi.statut === "Accepté" || currentDevi.statut === "Terminer";
    const toRestricted = statut === "En attente" || statut === "Annulé";
    const notImpaye =
      currentDevi.statutPaiement && currentDevi.statutPaiement !== "impaye";

    if (fromLocked && toRestricted && notImpaye) {
      return NextResponse.json(
        {
          error:
            "Impossible de passer un devis accepté ou terminé en attente ou annulé s'il n'est pas impayé.",
        },
        { status: 403 }
      );
    }

    // Préparer les données à mettre à jour
    const updateData = { statut };

    // Si le statut est "Terminer", définir dateEnd (date fournie ou aujourd'hui)
    if (statut === "Terminer") {
      updateData.dateEnd = parseDateEnd(dateEnd) || new Date();
    }
    // Si le statut actuel est "Terminer" et le nouveau statut n'est pas "Terminer", réinitialiser dateEnd à null
    else if (currentDevi?.statut === "Terminer" && statut !== "Terminer") {
      updateData.dateEnd = null;
    }

    const devi = await prisma.devis.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ devi });
  } catch (error) {
    console.error("Error updating devis statut:", error);
    return NextResponse.json(
      { error: "Failed to update devis statut" },
      { status: 500 }
    );
  }
}
