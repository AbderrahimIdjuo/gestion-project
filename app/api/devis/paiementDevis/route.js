import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const response = await req.json();
    const {
      numero,
      type,
      montant,
      compte,
      lable,
      description,
      date,
      methodePaiement,
      numeroCheque,
      clientId,
      typeDepense,
    } = response;
    const result = await prisma.$transaction(async prisma => {
      const devis = await prisma.devis.findUnique({
        where: { numero: numero },
      });
      const diff = devis.total - (devis.totalPaye + montant);
      const statutPaiement =
        diff === 0 || diff < 0 ? "paye" : diff > 0 ? "enPartie" : "impaye";
      // Modifier le statut de devis en cas de paiement d'un client
      await prisma.devis.update({
        where: { numero: numero },
        data: {
          ...(devis.dateStart === null && { dateStart: date || new Date() }),
          ...(devis.statut !== "Terminer" && { statut: "Accepté" }),
          totalPaye: {
            increment: montant, //augmente le montant paye
          },
          statutPaiement,
        },
      });

      //Creation du chèque
      let cheque = null;

      if (methodePaiement === "cheque") {
        cheque = await prisma.cheques.create({
          data: {
            type:
              type === "depense" ? "EMIS" : type === "recette" ? "RECU" : null,
            montant,
            compte,
            numero: numeroCheque,
            dateReglement: date || null,
          },
        });
      }
      const transaction = await prisma.transactions.create({
        data: {
          reference: numero,
          type,
          montant,
          compte: type === "vider" ? "caisse" : compte,
          lable,
          description,
          methodePaiement,
          clientId,
          date: date || new Date(),
          typeDepense,
          cheque: cheque
            ? {
                connect: { id: cheque.id }, // ✅ association one-to-one
              }
            : undefined,
        },
      });
      await prisma.comptesBancaires.updateMany({
        where: { compte: compte },
        data: {
          solde: { increment: montant },
        },
      });

      return { success: true, transaction };
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error creating devis:", error);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la création du devis.",
        details: error.message || "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
