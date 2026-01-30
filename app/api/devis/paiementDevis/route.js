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

      if (!devis) {
        throw new Error("Devis introuvable");
      }

      // Calculer le reste à payer
      const resteAPayer = devis.total - (devis.totalPaye || 0);

      // Vérifier que le montant de paiement ne dépasse pas le reste à payer
      if (montant > resteAPayer) {
        throw new Error(
          `Le montant de paiement (${montant} DH) ne peut pas dépasser le reste à payer (${resteAPayer} DH)`
        );
      }

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
      // Vérifier si le compte utilisé est le compte professionnel
      const compteLower = compte?.toLowerCase() || "";
      const isComptePro = compteLower.includes("professionnel") || compteLower.includes("professionel");

      if (isComptePro) {
        // Récupérer le compte professionnel
        const comptePro = await prisma.comptesBancaires.findFirst({
          where: {
            compte: {
              contains: "professionnel",
              mode: "insensitive",
            },
          },
        });

        if (comptePro) {
          // Récupérer le nom du client
          let clientNom = "";
          if (clientId) {
            const client = await prisma.clients.findUnique({
              where: { id: clientId },
              select: { nom: true },
            });
            if (client) {
              clientNom = client.nom;
            }
          }

          // Créer le versement avec sourceCompteId null
          await prisma.versement.create({
            data: {
              montant,
              sourceCompteId: null,
              compteProId: comptePro.id,
              reference: clientNom || null,
              note: "paiement devis",
              date: date || new Date(),
            },
          });

          // Incrémenter le solde du compte professionnel
          await prisma.comptesBancaires.update({
            where: { id: comptePro.id },
            data: {
              solde: {
                increment: montant,
              },
            },
          });
        }
      } else {
        // Si ce n'est pas le compte professionnel, incrémenter normalement le compte utilisé
        await prisma.comptesBancaires.updateMany({
          where: { compte: compte },
          data: {
            solde: { increment: montant },
          },
        });
      }

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
