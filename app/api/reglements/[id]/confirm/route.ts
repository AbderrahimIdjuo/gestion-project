import { PrismaClient } from "../../../../../generated/prisma";
import { NextResponse } from "next/server";
import { authErrorResponse, requireAuth } from "@/lib/auth-utils";
import {
  resteAPayer,
  statutPaiementFromTotals,
} from "@/lib/statut-paiement";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prisma: PrismaClient = require("../../../../../lib/prisma").default;

export const dynamic = "force-dynamic";

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const reglementResponseInclude = {
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
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

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

    const reglementExistant = await prisma.reglement.findUnique({
      where: { id },
      select: { id: true, datePrelevement: true },
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
      // Lock the row so parallel confirms cannot both apply Cas 1
      await tx.$queryRaw`SELECT id FROM "Reglement" WHERE id = ${id} FOR UPDATE`;

      const reglementLocked = await tx.reglement.findUnique({
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

      if (!reglementLocked) {
        throw new HttpError("Règlement non trouvé", 404);
      }

      if (!reglementLocked.datePrelevement) {
        throw new HttpError(
          "Impossible de changer le statut : le règlement n'a pas de date de prélèvement",
          400
        );
      }

      const ancienStatusPrelevement = reglementLocked.statusPrelevement;
      const nouveauStatusPrelevement = status;

      // Claim the status transition atomically; abort if another request already moved it
      const claimed = await tx.reglement.updateMany({
        where: {
          id,
          statusPrelevement: ancienStatusPrelevement,
        },
        data: updateData,
      });

      if (claimed.count === 0) {
        const latest = await tx.reglement.findUnique({
          where: { id },
          include: reglementResponseInclude,
        });
        if (latest && latest.statusPrelevement === nouveauStatusPrelevement) {
          return latest;
        }
        throw new HttpError(
          "Le statut de prélèvement a déjà été modifié",
          409
        );
      }

      // Gestion de la mise à jour du solde du compte bancaire, de la dette et des transactions selon le changement de statut
      // Cas 1: Passage à "confirme" (déduction du montant du compte + dette + création de transaction)
      if (
        nouveauStatusPrelevement === "confirme" &&
        ancienStatusPrelevement !== "confirme"
      ) {
        // Déduire le montant du compte bancaire car le prélèvement est confirmé
        await tx.comptesBancaires.updateMany({
          where: { compte: reglementLocked.compte },
          data: {
            solde: { decrement: reglementLocked.montant },
          },
        });

        await tx.fournisseurs.update({
          where: { id: reglementLocked.fournisseurId },
          data: { dette: { decrement: reglementLocked.montant } },
        });

        // Créer une transaction pour enregistrer le prélèvement confirmé
        await tx.transactions.create({
          data: {
            ReglementId: reglementLocked.id,
            reference: reglementLocked.id,
            type: "depense",
            montant: reglementLocked.montant,
            compte: reglementLocked.compte,
            fournisseurId: reglementLocked.fournisseurId,
            lable: "paiement fournisseur",
            description: "bénéficiaire :" + reglementLocked.fournisseur.nom,
            methodePaiement: reglementLocked.methodePaiement,
            date:
              reglementLocked.datePrelevement ||
              reglementLocked.dateReglement ||
              new Date(),
            datePrelevement: reglementLocked.datePrelevement || null,
            motif: reglementLocked.motif || null,
            chequeId: reglementLocked.chequeId,
          },
        });
      }
      // Cas 2: Passage de "confirme" à un autre statut : remboursement + dette + suppression transaction
      if (
        ancienStatusPrelevement === "confirme" &&
        nouveauStatusPrelevement !== "confirme"
      ) {
        await tx.comptesBancaires.updateMany({
          where: { compte: reglementLocked.compte },
          data: {
            solde: { increment: reglementLocked.montant },
          },
        });
        await tx.fournisseurs.update({
          where: { id: reglementLocked.fournisseurId },
          data: { dette: { increment: reglementLocked.montant } },
        });
        await tx.transactions.deleteMany({
          where: {
            OR: [
              { ReglementId: reglementLocked.id },
              { reference: reglementLocked.id, type: "depense" },
            ],
          },
        });
      }

      // Cas 3: Passage à "annulé" (quel que soit l'ancien statut) : inverser l'effet de création = annuler le paiement des BL et supprimer les allocations
      if (
        nouveauStatusPrelevement === "annule" &&
        ancienStatusPrelevement !== "annule"
      ) {
        if (reglementLocked.blAllocations && reglementLocked.blAllocations.length > 0) {
          for (const alloc of reglementLocked.blAllocations) {
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
        } else if (reglementLocked.reference) {
          const bonLivraison = await tx.bonLivraison.findUnique({
            where: { id: reglementLocked.reference },
          });
          if (bonLivraison) {
            const nouveauTotalPaye = Math.max(
              0,
              (bonLivraison.totalPaye ?? 0) - reglementLocked.montant
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
              where: { id: reglementLocked.reference },
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
        if (reglementLocked.blAllocations && reglementLocked.blAllocations.length > 0) {
          for (const alloc of reglementLocked.blAllocations) {
            const bl = await tx.bonLivraison.findUnique({
              where: { id: alloc.bonLivraisonId },
            });
            if (bl) {
              const nouveauTotalPaye = (bl.totalPaye ?? 0) + alloc.montant;
              const nouveauStatutPaiement = statutPaiementFromTotals(
                nouveauTotalPaye,
                bl.total
              );
              await tx.bonLivraison.update({
                where: { id: alloc.bonLivraisonId },
                data: {
                  totalPaye: nouveauTotalPaye,
                  statutPaiement: nouveauStatutPaiement,
                },
              });
            }
          }
        } else if (reglementLocked.reference) {
          const bonLivraison = await tx.bonLivraison.findUnique({
            where: { id: reglementLocked.reference },
          });
          if (bonLivraison) {
            const nouveauTotalPaye = (bonLivraison.totalPaye ?? 0) + reglementLocked.montant;
            const nouveauStatutPaiement = statutPaiementFromTotals(
              nouveauTotalPaye,
              bonLivraison.total
            );
            await tx.bonLivraison.update({
              where: { id: reglementLocked.reference },
              data: {
                totalPaye: nouveauTotalPaye,
                statutPaiement: nouveauStatutPaiement,
              },
            });
          }
        } else {
          const bonLivraisonList = await tx.bonLivraison.findMany({
            where: {
              fournisseurId: reglementLocked.fournisseurId,
              statutPaiement: { in: ["impaye", "enPartie"] },
              type: "achats",
            },
            orderBy: { date: "asc" },
          });
          let montantRestant = reglementLocked.montant;
          for (const bl of bonLivraisonList) {
            if (montantRestant <= 0) break;
            const totalPayeActuel = bl.totalPaye ?? 0;
            const reste = resteAPayer(bl.total, totalPayeActuel);
            let montantAlloue = 0;
            if (montantRestant >= reste) {
              montantAlloue = reste;
              montantRestant -= reste;
            } else {
              montantAlloue = montantRestant;
              montantRestant = 0;
            }
            if (montantAlloue > 0) {
              const nouveauTotalPaye = totalPayeActuel + montantAlloue;
              await tx.bonLivraison.update({
                where: { id: bl.id },
                data: {
                  totalPaye: nouveauTotalPaye,
                  statutPaiement: statutPaiementFromTotals(
                    nouveauTotalPaye,
                    bl.total
                  ),
                },
              });
            }
            if (montantAlloue > 0) {
              await tx.reglementBlAllocation.create({
                data: {
                  reglementId: reglementLocked.id,
                  bonLivraisonId: bl.id,
                  montant: montantAlloue,
                },
              });
            }
          }
        }
      }

      return await tx.reglement.findUniqueOrThrow({
        where: { id },
        include: reglementResponseInclude,
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
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour du statut de prélèvement",
      },
      { status: 500 }
    );
  }
}
