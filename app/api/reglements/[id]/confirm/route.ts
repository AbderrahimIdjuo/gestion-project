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
    const validStatuses = ["confirme", "annule", "reporte"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error:
            "Statut invalide. Doit être: confirme, annule, ou reporte",
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

    // Check if règlement exists (avec allocations BL pour mise à jour en cas d'annulation)
    const reglementExistant = await prisma.reglement.findUnique({
      where: { id },
      include: {
        fournisseur: {
          select: {
            id: true,
            nom: true,
          },
        },
        blAllocations: { orderBy: { id: "asc" } },
      },
    });

    if (!reglementExistant) {
      return NextResponse.json(
        { error: "Règlement non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le règlement a une date de prélèvement
    if (!reglementExistant.datePrelevement) {
      return NextResponse.json(
        {
          error:
            "Impossible de changer le statut : le règlement n'a pas de date de prélèvement",
        },
        { status: 400 }
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
            lable: "paiement fournisseur",
            description: "bénéficiaire :" + reglementExistant.fournisseur.nom,
            methodePaiement: reglementExistant.methodePaiement,
            date:
              reglementExistant.datePrelevement ||
              reglementExistant.dateReglement ||
              new Date(),
            datePrelevement: reglementExistant.datePrelevement || null,
            motif: reglementExistant.motif || null,
            cheque: reglementExistant.chequeId
              ? {
                  connect: { id: reglementExistant.chequeId },
                }
              : undefined,
          },
        });
      }
      // Cas 2: Passage de "confirme" à un autre statut : remboursement + suppression transaction
      if (
        ancienStatusPrelevement === "confirme" &&
        nouveauStatusPrelevement !== "confirme"
      ) {
        await tx.comptesBancaires.updateMany({
          where: { compte: reglementExistant.compte },
          data: {
            solde: { increment: reglementExistant.montant },
          },
        });
        await tx.transactions.deleteMany({
          where: {
            OR: [
              { ReglementId: reglementExistant.id },
              { reference: reglementExistant.id, type: "depense" },
            ],
          },
        });
      }

      // Cas 3: Passage à "annulé" (quel que soit l'ancien statut) : inverser l'effet de création = annuler le paiement des BL et supprimer les allocations
      if (
        nouveauStatusPrelevement === "annule" &&
        ancienStatusPrelevement !== "annule"
      ) {
        if (reglementExistant.blAllocations && reglementExistant.blAllocations.length > 0) {
          for (const alloc of reglementExistant.blAllocations) {
            const bl = await tx.bonLivraison.findUnique({
              where: { id: alloc.bonLivraisonId },
            });
            if (bl) {
              const nouveauTotalPaye = Math.max(
                0,
                (bl.totalPaye ?? 0) - alloc.montant
              );
              let nouveauStatutPaiement = "impaye";
              if (nouveauTotalPaye > 0 && nouveauTotalPaye < bl.total) {
                nouveauStatutPaiement = "enPartie";
              } else if (nouveauTotalPaye >= bl.total) {
                nouveauStatutPaiement = "paye";
              }
              await tx.bonLivraison.update({
                where: { id: alloc.bonLivraisonId },
                data: {
                  totalPaye: nouveauTotalPaye,
                  statutPaiement: nouveauStatutPaiement,
                },
              });
            }
          }
          await tx.reglementBlAllocation.deleteMany({ where: { reglementId: id } });
        } else if (reglementExistant.reference) {
          const bonLivraison = await tx.bonLivraison.findUnique({
            where: { id: reglementExistant.reference },
          });
          if (bonLivraison) {
            const nouveauTotalPaye = Math.max(
              0,
              (bonLivraison.totalPaye ?? 0) - reglementExistant.montant
            );
            let nouveauStatutPaiement = bonLivraison.statutPaiement;
            if (nouveauTotalPaye <= 0) {
              nouveauStatutPaiement = "impaye";
            } else if (nouveauTotalPaye < bonLivraison.total) {
              nouveauStatutPaiement = "enPartie";
            } else if (nouveauTotalPaye >= bonLivraison.total) {
              nouveauStatutPaiement = "paye";
            }
            await tx.bonLivraison.update({
              where: { id: reglementExistant.reference },
              data: {
                totalPaye: nouveauTotalPaye,
                statutPaiement: nouveauStatutPaiement,
              },
            });
          }
        }
      }

      // Cas 4: Passage de "annulé" à un autre statut : repayer les BL du fournisseur (les plus anciens d'abord)
      if (
        ancienStatusPrelevement === "annule" &&
        nouveauStatusPrelevement !== "annule"
      ) {
        if (reglementExistant.blAllocations && reglementExistant.blAllocations.length > 0) {
          for (const alloc of reglementExistant.blAllocations) {
            const bl = await tx.bonLivraison.findUnique({
              where: { id: alloc.bonLivraisonId },
            });
            if (bl) {
              const nouveauTotalPaye = (bl.totalPaye ?? 0) + alloc.montant;
              let nouveauStatutPaiement = "enPartie";
              if (nouveauTotalPaye >= bl.total) nouveauStatutPaiement = "paye";
              await tx.bonLivraison.update({
                where: { id: alloc.bonLivraisonId },
                data: {
                  totalPaye: nouveauTotalPaye,
                  statutPaiement: nouveauStatutPaiement,
                },
              });
            }
          }
        } else if (reglementExistant.reference) {
          const bonLivraison = await tx.bonLivraison.findUnique({
            where: { id: reglementExistant.reference },
          });
          if (bonLivraison) {
            const nouveauTotalPaye = (bonLivraison.totalPaye ?? 0) + reglementExistant.montant;
            let nouveauStatutPaiement = "enPartie";
            if (nouveauTotalPaye >= bonLivraison.total) nouveauStatutPaiement = "paye";
            await tx.bonLivraison.update({
              where: { id: reglementExistant.reference },
              data: {
                totalPaye: nouveauTotalPaye,
                statutPaiement: nouveauStatutPaiement,
              },
            });
          }
        } else {
          const bonLivraisonList = await tx.bonLivraison.findMany({
            where: {
              fournisseurId: reglementExistant.fournisseurId,
              statutPaiement: { in: ["impaye", "enPartie"] },
              type: "achats",
            },
            orderBy: { date: "asc" },
          });
          let montantRestant = reglementExistant.montant;
          for (const bl of bonLivraisonList) {
            if (montantRestant <= 0) break;
            const resteAPayer = bl.total - (bl.totalPaye ?? 0);
            let montantAlloue = 0;
            if (montantRestant >= resteAPayer) {
              montantAlloue = resteAPayer;
              montantRestant -= resteAPayer;
              await tx.bonLivraison.update({
                where: { id: bl.id },
                data: { totalPaye: bl.total, statutPaiement: "paye" },
              });
            } else {
              montantAlloue = montantRestant;
              montantRestant = 0;
              await tx.bonLivraison.update({
                where: { id: bl.id },
                data: {
                  totalPaye: { increment: montantAlloue },
                  statutPaiement: "enPartie",
                },
              });
            }
            if (montantAlloue > 0) {
              await tx.reglementBlAllocation.create({
                data: {
                  reglementId: reglementExistant.id,
                  bonLivraisonId: bl.id,
                  montant: montantAlloue,
                },
              });
            }
          }
        }
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
