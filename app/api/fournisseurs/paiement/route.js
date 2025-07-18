import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req) {
  console.log("POST /api/fournisseurs/paiement");

  try {
    const resopns = await req.json();
    const {
      type,
      montant,
      compte,
      lable,
      description,
      date,
      methodePaiement,
      fournisseurId,
    } = resopns;
    const result = await prisma.$transaction(async (prisma) => {
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
      // Paye les BL du fournisseur
      const montantDisponible = montant; // par exemple
      let montantRestant = montantDisponible;

      // Récupérer les BL impayés ou partiellement payés, triés par date croissante
      const bonLivraisonList = await prisma.bonLivraison.findMany({
        where: {
          fournisseurId,
          statutPaiement: {
            in: ["impaye", "enPartie"],
          },
          type: "achats",
        },
        orderBy: {
          date: "asc",
        },
      });

      for (const bl of bonLivraisonList) {
        const resteAPayer = bl.total - bl.totalPaye;

        if (montantRestant <= 0) break; // plus d'argent

        if (montantRestant >= resteAPayer) {
          // Payer entièrement
          montantRestant -= resteAPayer;

          await prisma.bonLivraison.update({
            where: { id: bl.id },
            data: {
              totalPaye: bl.total,
              statutPaiement: "paye",
            },
          });
        } else {
          // Payer partiellement
          await prisma.bonLivraison.update({
            where: { id: bl.id },
            data: {
              totalPaye: {
                increment: montantRestant,
              },
              statutPaiement: "enPartie",
            },
          });

          montantRestant = 0;
          break;
        }
      }
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
