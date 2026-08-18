import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { statutPaiementFromTotals } from "@/lib/statut-paiement";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const response = await req.json();
    const {
      bonLivraisonId,
      fournisseurId,
      compte,
      description,
      lable,
      montant,
      type,
      methodePaiement,
      numeroCheque,
      date,
      motif,
      datePrelevement,
      dateReglement,
    } = response;

    const montantNum = Number(montant);
    if (!bonLivraisonId || !Number.isFinite(montantNum) || montantNum <= 0) {
      return NextResponse.json(
        { message: "Montant ou bon de livraison invalide." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async prisma => {
      const bl = await prisma.bonLivraison.findUnique({
        where: { id: bonLivraisonId },
        select: { id: true, total: true, totalPaye: true },
      });
      if (!bl) {
        throw new Error("Bon de livraison introuvable");
      }

      const nouveauTotalPaye = (bl.totalPaye ?? 0) + montantNum;
      await prisma.bonLivraison.update({
        where: { id: bl.id },
        data: {
          totalPaye: nouveauTotalPaye,
          statutPaiement: statutPaiementFromTotals(nouveauTotalPaye, bl.total),
        },
      });

      //Creation du chèque
      let cheque = null;

      if (methodePaiement === "cheque") {
        cheque = await prisma.cheques.create({
          data: {
            type: "EMIS",
            montant: montantNum,
            compte,
            numero: numeroCheque, // ou une autre logique
            fournisseurId: fournisseurId || null,
            dateReglement: date || new Date(),
          },
        });
      }

      // Création d'un nouveau règlement (numero = numéro de chèque ou numéro de versement)
      const reglement = await prisma.reglement.create({
        data: {
          fournisseur: {
            connect: { id: fournisseurId },
          },
          compte: compte,
          montant: montantNum,
          reference: bonLivraisonId,
          methodePaiement: methodePaiement,
          dateReglement: dateReglement ? new Date(dateReglement) : new Date(),
          datePrelevement: datePrelevement ? new Date(datePrelevement) : null,
          motif: motif || null,
          statut: "en_attente",
          statusPrelevement:
            methodePaiement === "espece" || methodePaiement === "versement"
              ? "confirme"
              : "en_attente",
          numero:
            cheque != null
              ? cheque.numero ?? null
              : methodePaiement === "versement"
                ? numeroCheque ?? null
                : null,
          cheque: cheque
            ? {
                connect: { id: cheque.id },
              }
            : undefined,
        },
      });

      // Lier le règlement au BL via ReglementBlAllocation (pour l'historique des règlements sur le BL)
      await prisma.reglementBlAllocation.create({
        data: {
          reglementId: reglement.id,
          bonLivraisonId: bonLivraisonId,
          montant: montantNum,
        },
      });

      // creation de la transaction uniquement si méthode de paiement est "espece" ou "versement"
      if (methodePaiement === "espece" || methodePaiement === "versement") {
        await prisma.transactions.create({
          data: {
            ReglementId: reglement ? reglement.id : null,
            reference: reglement ? reglement.id : null,
            type,
            montant: montantNum,
            compte,
            fournisseurId: fournisseurId,
            lable,
            description,
            motif,
            datePrelevement,
            methodePaiement,
            date: dateReglement || new Date(),
            cheque: cheque
              ? {
                  connect: { id: cheque.id }, // ✅ association one-to-one
                }
              : undefined,
          },
        });

        // mise à jour du solde du compte bancaire
        await prisma.comptesBancaires.updateMany({
          where: { compte: compte },
          data: {
            solde: { decrement: montantNum },
          },
        });

        // mise à jour de la dette du fournisseur
        await prisma.fournisseurs.update({
          where: { id: fournisseurId },
          data: {
            dette: { decrement: montantNum },
          },
        });
      }
      // creation de la transaction
      // await prisma.transactions.create({
      //   data: {
      //     reference,
      //     fournisseurId: fournisseurId || null,
      //     type,
      //     montant,
      //     compte,
      //     lable,
      //     description,
      //     methodePaiement,
      //     date: date || new Date(),
      //     cheque: cheque
      //       ? {
      //           connect: { id: cheque.id }, // ✅ association one-to-one
      //         }
      //       : undefined,
      //   },
      // }),
      // mise à jour du solde du compte bancaire
      // await prisma.comptesBancaires.updateMany({
      //   where: { compte: compte },
      //   data: {
      //     solde: { decrement: montant },
      //   },
      // });
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error creating BL:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
