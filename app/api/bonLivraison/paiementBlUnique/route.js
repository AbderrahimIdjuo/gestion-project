import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

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
      statutPaiement,
    } = response;

    const result = await prisma.$transaction(async (prisma) => {
      //Update the BL
      await prisma.bonLivraison.update({
        where: { id: bonLivraisonId },
        data: {
          ...(statutPaiement !== undefined && { statutPaiement }),
          totalPaye: { increment: montant },
        },
      });

      //Creation du chèque
      let cheque = null;

      if (methodePaiement === "cheque") {
        cheque = await prisma.cheques.create({
          data: {
            type: "EMIS",
            montant,
            compte,
            numero: numeroCheque, // ou une autre logique
            fournisseurId: fournisseurId || null,
            dateReglement: date || new Date(),
          },
        });
      }

      // creation de la transaction
      await prisma.transactions.create({
        data: {
          reference: fournisseurId ? fournisseurId : null,
          type,
          montant,
          compte,
          lable,
          description,
          methodePaiement,
          date: date || new Date(),
          cheque: cheque
            ? {
                connect: { id: cheque.id }, // ✅ association one-to-one
              }
            : undefined,
        },
      }),
        // mise à jour du solde du compte bancaire
        await prisma.comptesBancaires.updateMany({
          where: { compte: compte },
          data: {
            solde: { decrement: montant },
          },
        }),
        // mise à jour de la dette du fournisseur
        await prisma.fournisseurs.update({
          where: { id: fournisseurId },
          data: {
            dette: { decrement: montant },
          },
        });
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
