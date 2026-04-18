import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import {
  applyReglementMontantChangeToBonLivraisons,
  ReglementMontantInvalideError,
} from "@/lib/reglement-montant-bl-sync";

/**
 * Même logique métier que PUT /api/reglement (chèque, soldes banque, BL comme paiement fournisseur, dette).
 * Appelé quand on modifie une transaction liée à un règlement (ReglementId).
 * Retourne le chequeId à enregistrer sur la transaction.
 */
async function syncLinkedReglementOnTransactionEdit(tx, params) {
  const {
    reglementExistant,
    montant,
    compte,
    methodePaiement,
    numeroCheque,
    date,
    motif,
    datePrelevement,
  } = params;

  const id = reglementExistant.id;
  const ancienMontantReglement = reglementExistant.montant;
  const nouveauMontantReglement =
    typeof montant === "number" && !Number.isNaN(montant)
      ? montant
      : Number(montant) || reglementExistant.montant;

  let chequeId = reglementExistant.chequeId;
  const mp = methodePaiement || reglementExistant.methodePaiement;

  if (mp === "cheque" || mp === "traite") {
    if (reglementExistant.cheque) {
      await tx.cheques.update({
        where: { id: reglementExistant.cheque.id },
        data: {
          numero: numeroCheque || reglementExistant.cheque.numero,
          montant: nouveauMontantReglement,
          compte: compte || reglementExistant.compte,
          dateReglement: date ? new Date(date) : reglementExistant.dateReglement,
          datePrelevement: datePrelevement
            ? new Date(datePrelevement)
            : reglementExistant.cheque.datePrelevement,
        },
      });
    } else {
      const nouveauCheque = await tx.cheques.create({
        data: {
          type: "EMIS",
          montant: nouveauMontantReglement,
          compte: compte || reglementExistant.compte,
          numero: numeroCheque,
          fournisseurId: reglementExistant.fournisseurId,
          dateReglement: date ? new Date(date) : reglementExistant.dateReglement,
          datePrelevement: datePrelevement ? new Date(datePrelevement) : null,
        },
      });
      chequeId = nouveauCheque.id;
    }
  } else if (reglementExistant.chequeId) {
    await tx.cheques.delete({
      where: { id: reglementExistant.chequeId },
    });
    chequeId = null;
  }

  const nouveauCompteFinal = compte || reglementExistant.compte;

  if (
    nouveauMontantReglement !== ancienMontantReglement ||
    nouveauCompteFinal !== reglementExistant.compte
  ) {
    await tx.comptesBancaires.updateMany({
      where: { compte: reglementExistant.compte },
      data: { solde: { increment: ancienMontantReglement } },
    });
    await tx.comptesBancaires.updateMany({
      where: { compte: nouveauCompteFinal },
      data: { solde: { decrement: nouveauMontantReglement } },
    });
  }

  const nouveauNumero =
    mp === "cheque" || mp === "traite"
      ? numeroCheque ??
        reglementExistant.cheque?.numero ??
        reglementExistant.numero ??
        null
      : mp === "versement"
        ? numeroCheque ?? reglementExistant.numero ?? null
        : reglementExistant.numero ?? null;

  await tx.reglement.update({
    where: { id },
    data: {
      montant: nouveauMontantReglement,
      compte: nouveauCompteFinal,
      methodePaiement: mp,
      dateReglement: date ? new Date(date) : reglementExistant.dateReglement,
      datePrelevement:
        datePrelevement !== undefined && datePrelevement !== null
          ? new Date(datePrelevement)
          : reglementExistant.datePrelevement,
      motif: motif !== undefined ? motif : reglementExistant.motif,
      numero: nouveauNumero,
      chequeId,
    },
  });

  await applyReglementMontantChangeToBonLivraisons(tx, {
    reglementId: reglementExistant.id,
    fournisseurId: reglementExistant.fournisseurId,
    ancienMontantReglement,
    nouveauMontantReglement,
    reference: reglementExistant.reference,
    blAllocations: reglementExistant.blAllocations,
  });

  const deltaDette = ancienMontantReglement - nouveauMontantReglement;
  if (deltaDette !== 0) {
    await tx.fournisseurs.update({
      where: { id: reglementExistant.fournisseurId },
      data:
        deltaDette > 0
          ? { dette: { increment: deltaDette } }
          : { dette: { decrement: -deltaDette } },
    });
  }

  return chequeId;
}

export async function PUT(req) {
  try {
    // Seul admin peut modifier
    await requireAdmin();

    const response = await req.json();
    const {
      id,
      date,
      fournisseurId,
      clientId,
      compte,
      methodePaiement,
      numeroCheque,
      description,
      type,
      montant,
      lable,
      chequeId,
      reference,
    } = response;

    // Récupérer la transaction existante pour calculer la différence
    const existingTransaction = await prisma.transactions.findUnique({
      where: { id },
      include: {
        cheque: true,
        reglement: {
          include: {
            cheque: true,
            fournisseur: { select: { id: true, nom: true } },
            blAllocations: { orderBy: { id: "asc" } },
          },
        },
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { message: "Transaction non trouvée." },
        { status: 404 }
      );
    }

    // Calculer la différence de montant
    const montantDifference = montant - existingTransaction.montant;

    // Utiliser une transaction Prisma pour garantir la cohérence
    const result = await prisma.$transaction(
      async tx => {
        const linkedReglement =
          existingTransaction.ReglementId && existingTransaction.reglement
            ? existingTransaction.reglement
            : null;

        let resolvedChequeId = existingTransaction.chequeId;

        if (linkedReglement) {
          resolvedChequeId = await syncLinkedReglementOnTransactionEdit(tx, {
            reglementExistant: linkedReglement,
            montant: Number(montant),
            compte,
            methodePaiement,
            numeroCheque,
            date,
            motif: existingTransaction.motif,
            datePrelevement: existingTransaction.datePrelevement,
          });
        } else if (numeroCheque && methodePaiement === "cheque") {
          if (existingTransaction.chequeId) {
            await tx.cheques.update({
              where: { id: existingTransaction.chequeId },
              data: {
                numero: numeroCheque,
                compte,
                montant,
                dateReglement: date,
              },
            });
            resolvedChequeId = existingTransaction.chequeId;
            console.log(`Chèque existant mis à jour: ${numeroCheque}`);
          } else {
            const newCheque = await tx.cheques.create({
              data: {
                numero: numeroCheque,
                compte,
                montant,
                dateReglement: date,
                type: "EMIS",
              },
            });
            resolvedChequeId = newCheque.id;
            console.log(
              `Nouveau chèque créé: ${numeroCheque} avec ID: ${newCheque.id}`
            );
          }
        } else if (existingTransaction.chequeId) {
          console.log(
            `🗑️ Suppression du chèque existant: ${existingTransaction.chequeId}`
          );
          await tx.transactions.update({
            where: { id },
            data: { chequeId: null },
          });
          await tx.cheques.delete({
            where: { id: existingTransaction.chequeId },
          });
          resolvedChequeId = null;
          console.log("✅ Chèque supprimé avec succès");
        }

        const updatedTransaction = await tx.transactions.update({
          where: { id },
          data: {
            date,
            clientId,
            fournisseurId,
            compte,
            methodePaiement,
            montant,
            description,
            type,
            lable,
            chequeId: resolvedChequeId,
          },
        });

        const compteChanged = existingTransaction.compte !== compte;
        const skipTransactionBankAdjust = Boolean(linkedReglement);

        if (
          !skipTransactionBankAdjust &&
          (montantDifference !== 0 || compteChanged)
        ) {
          if (compteChanged) {
            // Si le compte a changé, ajuster les deux comptes
            console.log(
              `Changement de compte: ${existingTransaction.compte} → ${compte}`
            );

            // Vérifier que l'ancien compte existe
            const oldCompte = await tx.comptesBancaires.findFirst({
              where: { compte: existingTransaction.compte },
            });

            if (oldCompte) {
              // Annuler l'effet historique sur l'ancien compte (inverse de la création)
              // dépense créée → solde -= m  →  annulation : solde += m
              // recette créée → solde += m  →  annulation : solde -= m
              let reverseOld = 0;
              if (existingTransaction.type === "depense") {
                reverseOld = existingTransaction.montant;
              } else if (existingTransaction.type === "recette") {
                reverseOld = -existingTransaction.montant;
              }

              if (reverseOld !== 0) {
                const resultOld = await tx.comptesBancaires.updateMany({
                  where: { compte: existingTransaction.compte },
                  data: {
                    solde: { increment: reverseOld },
                  },
                });
                console.log(
                  `Ancien compte (${existingTransaction.compte}) : annulation effet ${existingTransaction.type}, increment solde: ${reverseOld}, lignes: ${resultOld.count}`
                );
              }
            } else {
              console.log(
                `Ancien compte non trouvé: ${existingTransaction.compte}`
              );
            }

            // Vérifier que le nouveau compte existe
            const newCompte = await tx.comptesBancaires.findFirst({
              where: { compte },
            });

            if (newCompte) {
              // Ajouter le nouveau montant au nouveau compte selon son type
              let montantAAjouter = montant;
              if (type === "depense") {
                // Pour une dépense, on retire le montant (solde diminue)
                montantAAjouter = -montant;
              } else if (type === "recette") {
                // Pour une recette, on ajoute le montant (solde augmente)
                montantAAjouter = montant;
              }

              const resultNew = await tx.comptesBancaires.updateMany({
                where: { compte },
                data: {
                  solde: {
                    increment: montantAAjouter,
                  },
                },
              });
              console.log(
                `Nouveau compte mis à jour: ${resultNew.count} comptes affectés, montant ajouté: ${montantAAjouter}`
              );
            } else {
              console.log(`Nouveau compte non trouvé: ${compte}`);
            }
          } else {
            // Si seul le montant a changé, ajuster le même compte
            console.log(
              `Montant modifié: ${existingTransaction.montant} → ${montant} (différence: ${montantDifference})`
            );

            // Calculer la différence de montant selon le type de transaction
            let differenceSolde = 0;
            if (type === "depense") {
              // Pour une dépense, la différence de solde est l'opposé de la différence de montant
              differenceSolde = -montantDifference;
            } else if (type === "recette") {
              // Pour une recette, la différence de solde est la même que la différence de montant
              differenceSolde = montantDifference;
            }

            const result = await tx.comptesBancaires.updateMany({
              where: { compte },
              data: {
                solde: {
                  increment: differenceSolde,
                },
              },
            });
            console.log(
              `Compte mis à jour: ${result.count} comptes affectés, différence de solde: ${differenceSolde}`
            );
          }
        }

        // 4. Si c'est une transaction client, mettre à jour les devis
        if (clientId && reference) {
          // Trouver le devis correspondant
          const devis = await tx.devis.findFirst({
            where: {
              numero: reference,
            },
          });

          if (devis) {
            // Calculer le nouveau totalPaye
            const nouveauTotalPaye = devis.totalPaye + montantDifference;

            // Déterminer le nouveau statut de paiement
            let nouveauStatutPaiement = "enPartie";
            if (nouveauTotalPaye >= devis.montantTotal) {
              nouveauStatutPaiement = "paye";
            } else if (nouveauTotalPaye <= 0) {
              nouveauStatutPaiement = "impaye";
            }

            // Mettre à jour le devis
            await tx.devis.update({
              where: { id: devis.id },
              data: {
                totalPaye: nouveauTotalPaye,
                statutPaiement: nouveauStatutPaiement,
              },
            });
          }
        }

        // 5. Si c'est une transaction fournisseur avec référence BL, mettre à jour le bon de livraison
        // (ignorer si liée à un règlement : déjà traité via syncLinkedReglementOnTransactionEdit)
        if (
          !linkedReglement &&
          fournisseurId &&
          reference &&
          reference.startsWith("BL-")
        ) {
          console.log(`🔍 Mise à jour du bon de livraison: ${reference}`);

          // Trouver le bon de livraison correspondant
          const bonLivraison = await tx.bonLivraison.findFirst({
            where: {
              numero: reference,
            },
            select: { id: true, total: true, totalPaye: true },
          });

          if (bonLivraison) {
            // Calculer le nouveau totalPaye
            const nouveauTotalPaye =
              (bonLivraison.totalPaye || 0) + montantDifference;

            // Déterminer le nouveau statut de paiement
            let nouveauStatutPaiement = "enPartie";
            if (nouveauTotalPaye <= 0) {
              nouveauStatutPaiement = "impaye";
            } else if (nouveauTotalPaye >= bonLivraison.total) {
              nouveauStatutPaiement = "paye";
            }

            // Mettre à jour le bon de livraison
            await tx.bonLivraison.update({
              where: { id: bonLivraison.id },
              data: {
                totalPaye: nouveauTotalPaye,
                statutPaiement: nouveauStatutPaiement,
              },
            });

            console.log(
              `✅ BL ${reference} mis à jour: totalPaye=${nouveauTotalPaye}, statutPaiement=${nouveauStatutPaiement}`
            );
          } else {
            console.log(`⚠️ Bon de livraison ${reference} non trouvé`);
          }
        }

        // 6. Si c'est une transaction "paiement fournisseur", modifier les BL liés au fournisseur
        // (ignorer si liée à un règlement : déjà traité côté règlement)
        if (!linkedReglement && fournisseurId && lable === "paiement fournisseur") {
          console.log(
            `🔍 Modification des BL pour le fournisseur: ${fournisseurId}`
          );
          console.log(`💰 Différence de montant: ${montantDifference}€`);

          // Récupérer tous les BL liés au fournisseur, triés par date croissante (plus anciens d'abord)
          const bonLivraisonList = await tx.bonLivraison.findMany({
            where: {
              fournisseurId,
              statutPaiement: { in: ["paye", "enPartie"] },
              type: "achats",
            },
            orderBy: { date: "asc" },
          });

          console.log(
            `📋 ${bonLivraisonList.length} BL trouvés pour le fournisseur ${fournisseurId}`
          );

          if (montantDifference > 0) {
            // Montant augmenté - on doit payer plus de BL
            console.log(`➕ Montant augmenté: traitement des BL impayés`);

            let montantRestant = montantDifference;

            for (const bl of bonLivraisonList) {
              if (montantRestant <= 0) break;

              const resteAPayer = bl.total - bl.totalPaye;
              const montantAPayer = Math.min(montantRestant, resteAPayer);

              const nouveauTotalPaye = bl.totalPaye + montantAPayer;
              let nouveauStatutPaiement = "enPartie";

              if (nouveauTotalPaye >= bl.total) {
                nouveauStatutPaiement = "paye";
              } else if (nouveauTotalPaye <= 0) {
                nouveauStatutPaiement = "impaye";
              }

              await tx.bonLivraison.update({
                where: { id: bl.id },
                data: {
                  totalPaye: nouveauTotalPaye,
                  statutPaiement: nouveauStatutPaiement,
                },
              });

              console.log(
                `✅ BL ${bl.numero}: totalPaye=${nouveauTotalPaye}€, statut=${nouveauStatutPaiement}`
              );
              montantRestant -= montantAPayer;
            }

            if (montantRestant > 0) {
              console.log(
                `⚠️ ${montantRestant}€ non utilisés (tous les BL sont payés)`
              );
            }
          } else if (montantDifference < 0) {
            // Montant diminué - on doit déduire des BL payés
            console.log(`➖ Montant diminué: déduction des BL payés`);

            let montantADeduire = Math.abs(montantDifference);

            // Traiter les BL dans l'ordre inverse (plus récents d'abord)
            for (let i = bonLivraisonList.length - 1; i >= 0; i--) {
              const bl = bonLivraisonList[i];
              if (montantADeduire <= 0) break;

              const montantPayeSurCeBL = bl.totalPaye;
              const montantADeduireSurCeBL = Math.min(
                montantADeduire,
                montantPayeSurCeBL
              );

              const nouveauTotalPaye = bl.totalPaye - montantADeduireSurCeBL;
              let nouveauStatutPaiement = "enPartie";

              if (nouveauTotalPaye <= 0) {
                nouveauStatutPaiement = "impaye";
              } else if (nouveauTotalPaye >= bl.total) {
                nouveauStatutPaiement = "paye";
              }

              await tx.bonLivraison.update({
                where: { id: bl.id },
                data: {
                  totalPaye: nouveauTotalPaye,
                  statutPaiement: nouveauStatutPaiement,
                },
              });

              console.log(
                `✅ BL ${bl.numero}: totalPaye=${nouveauTotalPaye}€, statut=${nouveauStatutPaiement}`
              );
              montantADeduire -= montantADeduireSurCeBL;
            }

            if (montantADeduire > 0) {
              console.log(
                `⚠️ ${montantADeduire}€ non déduits (tous les BL sont impayés)`
              );
            }
          } else {
            console.log(`ℹ️ Aucun changement de montant pour les BL`);
          }
        }

        return updatedTransaction;
      },
      {
        // Temps max d’exécution de la transaction
        timeout: 60_000, // 15 s (par défaut 5_000 ms)
        // Temps max d’attente avant de démarrer (connexion/locks)
        maxWait: 5_000, // optionnel
        // isolationLevel: "ReadCommitted", // optionnel
      }
    );

    return NextResponse.json({
      success: true,
      message: "Transaction mise à jour avec succès",
      result,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);

    if (
      error instanceof ReglementMontantInvalideError ||
      error?.name === "ReglementMontantInvalideError"
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error?.message?.includes("Access denied")) {
      return NextResponse.json(
        { message: "Accès refusé. Rôle admin requis." },
        { status: 403 }
      );
    }

    if (error?.message?.includes("Authentication required")) {
      return NextResponse.json(
        { message: "Authentification requise" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
