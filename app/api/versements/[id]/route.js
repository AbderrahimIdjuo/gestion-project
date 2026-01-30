import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = "force-dynamic";

// PUT - Modifier un versement
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { montant, sourceCompteId, reference, note } = body;

    if (!id) {
      return NextResponse.json(
        { error: "L'ID du versement est requis" },
        { status: 400 }
      );
    }

    // Validation
    if (!montant || montant <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être supérieur à 0" },
        { status: 400 }
      );
    }

    // sourceCompteId peut être null pour les versements créés depuis des paiements de devis

    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Récupérer le versement existant avec les comptes
      const versementExistant = await tx.versement.findUnique({
        where: { id },
        include: {
          sourceCompte: {
            select: {
              id: true,
              solde: true,
            },
          },
          comptePro: {
            select: {
              id: true,
              solde: true,
            },
          },
          affectationsVersement: true,
        },
      });

      if (!versementExistant) {
        throw new Error("Versement introuvable");
      }

      // Vérifier que le montant total des affectations ne dépasse pas le nouveau montant
      const montantTotalAffecte = versementExistant.affectationsVersement.reduce(
        (sum, aff) => sum + aff.montant,
        0
      );

      if (montant < montantTotalAffecte) {
        throw new Error(
          `Le nouveau montant (${montant}) ne peut pas être inférieur au montant déjà affecté (${montantTotalAffecte})`
        );
      }

      // Vérifier que le compte source n'est pas le compte pro (si sourceCompteId est fourni)
      if (sourceCompteId && sourceCompteId === versementExistant.compteProId) {
        throw new Error("Le compte source ne peut pas être le compte professionnel");
      }

      // Récupérer le nouveau compte source si fourni
      let nouveauCompteSource = null;
      if (sourceCompteId) {
        nouveauCompteSource = await tx.comptesBancaires.findUnique({
          where: { id: sourceCompteId },
        });

        if (!nouveauCompteSource) {
          throw new Error("Compte source introuvable");
        }
      }

      // Calculer les différences
      const ancienMontant = versementExistant.montant;
      const nouveauMontant = montant;
      const differenceMontant = nouveauMontant - ancienMontant;
      const compteSourceChange = versementExistant.sourceCompteId !== sourceCompteId;

      // Gérer les différents cas de changement de compte source
      if (compteSourceChange) {
        // Si l'ancien versement avait un compte source, restaurer son solde
        if (versementExistant.sourceCompteId) {
          await tx.comptesBancaires.update({
            where: { id: versementExistant.sourceCompteId },
            data: {
              solde: {
                increment: ancienMontant,
              },
            },
          });
        }

        // Si le nouveau versement a un compte source, décrémenter son solde
        if (sourceCompteId && nouveauCompteSource) {
          // Vérifier le solde suffisant du nouveau compte source
          if (nouveauCompteSource.solde < nouveauMontant) {
            throw new Error(
              `Solde insuffisant dans le nouveau compte source. Solde disponible: ${nouveauCompteSource.solde} DH`
            );
          }

          await tx.comptesBancaires.update({
            where: { id: sourceCompteId },
            data: {
              solde: {
                decrement: nouveauMontant,
              },
            },
          });
        }
      } else if (sourceCompteId && nouveauCompteSource) {
        // Même compte source, ajuster seulement la différence
        const nouveauSoldeSource = nouveauCompteSource.solde - differenceMontant;

        if (nouveauSoldeSource < 0) {
          throw new Error(
            `Solde insuffisant. Solde disponible: ${nouveauCompteSource.solde} DH, différence nécessaire: ${differenceMontant} DH`
          );
        }

        await tx.comptesBancaires.update({
          where: { id: sourceCompteId },
          data: {
            solde: {
              decrement: differenceMontant,
            },
          },
        });
      }

      // Ajuster le solde du compte pro
      await tx.comptesBancaires.update({
        where: { id: versementExistant.compteProId },
        data: {
          solde: {
            increment: differenceMontant,
          },
        },
      });

      // Mettre à jour le versement
      const versement = await tx.versement.update({
        where: { id },
        data: {
          montant: nouveauMontant,
          sourceCompteId: sourceCompteId !== undefined ? sourceCompteId : versementExistant.sourceCompteId,
          reference: reference !== undefined ? reference : versementExistant.reference,
          note: note !== undefined ? note : versementExistant.note,
        },
        include: {
          sourceCompte: {
            select: {
              id: true,
              compte: true,
              solde: true,
            },
          },
          comptePro: {
            select: {
              id: true,
              compte: true,
              solde: true,
            },
          },
          affectationsVersement: {
            select: {
              id: true,
              montant: true,
              factureId: true,
              facture: {
                select: {
                  id: true,
                  numero: true,
                  date: true,
                  total: true,
                  client: {
                    select: {
                      id: true,
                      nom: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return versement;
    });

    return NextResponse.json({
      success: true,
      message: "Versement modifié avec succès",
      data: result,
    });
  } catch (error) {
    console.error("Erreur lors de la modification du versement:", error);
    return NextResponse.json(
      {
        error: error.message || "Une erreur est survenue lors de la modification",
      },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un versement
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "L'ID du versement est requis" },
        { status: 400 }
      );
    }

    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Récupérer le versement avec les comptes
      const versement = await tx.versement.findUnique({
        where: { id },
        include: {
          sourceCompte: {
            select: {
              id: true,
              solde: true,
            },
          },
          comptePro: {
            select: {
              id: true,
              solde: true,
            },
          },
        },
      });

      if (!versement) {
        throw new Error("Versement introuvable");
      }

      // Restaurer le solde du compte source seulement s'il existe
      if (versement.sourceCompteId) {
        await tx.comptesBancaires.update({
          where: { id: versement.sourceCompteId },
          data: {
            solde: {
              increment: versement.montant,
            },
          },
        });
      }

      // Restaurer le solde du compte pro (retirer le montant)
      await tx.comptesBancaires.update({
        where: { id: versement.compteProId },
        data: {
          solde: {
            decrement: versement.montant,
          },
        },
      });

      // Supprimer le versement
      await tx.versement.delete({
        where: { id },
      });

      return { success: true };
    });

    return NextResponse.json({
      success: true,
      message: "Versement supprimé avec succès",
      data: result,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du versement:", error);
    return NextResponse.json(
      {
        error: error.message || "Une erreur est survenue lors de la suppression",
      },
      { status: 500 }
    );
  }
}

