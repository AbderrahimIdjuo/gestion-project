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

        if (methodePaiement === "cheque" || methodePaiement === "traite") {
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

        // Création d'un nouveau règlement (numero = numéro de chèque ou numéro de versement)
        const reglement = await prisma.reglement.create({
          data: {
            fournisseur: {
              connect: { id: fournisseurId },
            },
            compte: compte,
            montant: montant,
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

        // Diminuer la dette du fournisseur pour tout nouveau règlement
        await prisma.fournisseurs.update({
          where: { id: fournisseurId },
          data: { dette: { decrement: montant } },
        });

        // creation de la transaction uniquement si méthode de paiement est "espece" ou "versement"
        if (methodePaiement === "espece" || methodePaiement === "versement") {
          await prisma.transactions.create({
            data: {
              ReglementId: reglement.id,
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
          });

          // mise à jour du solde du compte bancaire
          await prisma.comptesBancaires.updateMany({
            where: { compte: compte },
            data: {
              solde: { decrement: montant },
            },
          });
        }

        // Paye les BL du fournisseur (les plus anciens d'abord) et enregistre chaque allocation
        let montantRestant = montant;

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
          const totalPayeActuel = bl.totalPaye ?? 0;
          const resteAPayer = bl.total - totalPayeActuel;

          if (montantRestant <= 0) break;

          let montantAlloue = 0;
          if (montantRestant >= resteAPayer) {
            montantAlloue = resteAPayer;
            montantRestant -= resteAPayer;
            await prisma.bonLivraison.update({
              where: { id: bl.id },
              data: {
                totalPaye: bl.total,
                statutPaiement: "paye",
              },
            });
          } else {
            montantAlloue = montantRestant;
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
          }

          if (montantAlloue > 0) {
            await prisma.reglementBlAllocation.create({
              data: {
                reglementId: reglement.id,
                bonLivraisonId: bl.id,
                montant: montantAlloue,
              },
            });
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
