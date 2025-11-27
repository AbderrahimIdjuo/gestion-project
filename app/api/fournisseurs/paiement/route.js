import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const {
      type,
      montant,
      compte,
      lable,
      description,
      methodePaiement,
      fournisseurId,
      dateReglement,
      numeroCheque,
      motif,
      datePrelevement,
    } = resopns;
    const result = await prisma.$transaction(
      async prisma => {
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
              dateReglement: dateReglement || new Date(),
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
        }),
          // mise à jour du solde du compte bancaire
          await prisma.comptesBancaires.updateMany({
            where: { compte: compte },
            data: {
              solde: { decrement: montant },
            },
          });

        // mise à jour de la dette du fournisseur
        // await prisma.fournisseurs.update({
        //   where: { id: fournisseurId },
        //   data: {
        //     dette: { decrement: montant },
        //   },
        // });

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
      },
      {
        // Temps max d’exécution de la transaction
        timeout: 60_000, // 15 s (par défaut 5_000 ms)
        // Temps max d’attente avant de démarrer (connexion/locks)
        maxWait: 5_000, // optionnel
        // isolationLevel: "ReadCommitted", // optionnel
      }
    );
    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
