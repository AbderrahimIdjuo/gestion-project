import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prisma: PrismaClient = require("../../../../../lib/prisma").default;

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, newDate } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID du règlement est requis" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["confirme", "echoue", "reporte", "refuse"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error:
            "Statut invalide. Doit être: confirme, echoue, reporte, ou refuse",
        },
        { status: 400 }
      );
    }

    // If status is "reporte", newDate is required
    if (status === "reporte" && !newDate) {
      return NextResponse.json(
        { error: "Une nouvelle date est requise pour un prélèvement reporté" },
        { status: 400 }
      );
    }

    // Check if règlement exists
    const reglementExistant = await prisma.reglement.findUnique({
      where: { id },
    });

    if (!reglementExistant) {
      return NextResponse.json(
        { error: "Règlement non trouvé" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      statusPrelevement: string;
      datePrelevement?: Date;
    } = {
      statusPrelevement: status,
    };

    // If reporté, update the datePrelevement
    if (status === "reporte" && newDate) {
      updateData.datePrelevement = new Date(newDate);
    }

    // Utiliser une transaction pour garantir la cohérence
    const updatedReglement = await prisma.$transaction(async tx => {
      const ancienStatusPrelevement = reglementExistant.statusPrelevement;
      const nouveauStatusPrelevement = status;

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

        // Créer une transaction pour enregistrer le prélèvement confirmé
        await tx.transactions.create({
          data: {
            reference: reglementExistant.id,
            type: "depense",
            montant: reglementExistant.montant,
            compte: reglementExistant.compte,
            fournisseurId: reglementExistant.fournisseurId,
            lable: `Règlement prélèvement confirmé`,
            description: `Prélèvement confirmé pour le règlement ${reglementExistant.id}`,
            methodePaiement: reglementExistant.methodePaiement,
            date:
              reglementExistant.datePrelevement ||
              reglementExistant.dateReglement ||
              new Date(),
            datePrelevement: reglementExistant.datePrelevement || null,
            motif: reglementExistant.motif || null,
            chequeId: reglementExistant.chequeId || null,
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

      // Update the règlement
      return await tx.reglement.update({
        where: { id },
        data: updateData,
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
    });

    return NextResponse.json({
      reglement: updatedReglement,
      message: "Statut de prélèvement mis à jour avec succès",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du statut de prélèvement:",
      error
    );
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour du statut de prélèvement",
      },
      { status: 500 }
    );
  }
}
