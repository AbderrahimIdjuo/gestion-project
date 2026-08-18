import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

/** Fournisseur fictif pour sorties de stock interne */
const STOCK_SORTIE_FOURNISSEUR_NOM = "STOCK(sortie)";
/** Charge « entrée stock » sur un groupe de BL */
const STOCK_ENTREE_CHARGE_NOM = "STOCK(entrée)";

function isStockSortieFournisseur(nom) {
  return (
    typeof nom === "string" && nom.trim() === STOCK_SORTIE_FOURNISSEUR_NOM
  );
}

function isStockEntreeCharge(charge) {
  return (
    typeof charge === "string" && charge.trim() === STOCK_ENTREE_CHARGE_NOM
  );
}

/**
 * Inverse l'effet stock de la création :
 * - groupes charge STOCK(entrée) → retirer les quantités du stock
 * - fournisseur STOCK(sortie) → remettre les quantités en stock
 */
async function reverseStockEffectsOnDelete(tx, bonLivraison) {
  const groups = bonLivraison.groups || [];
  const type = bonLivraison.type;
  const fournisseurNom = bonLivraison.fournisseur?.nom;

  // Inverse STOCK(entrée) : création avait augmenté le stock
  if (type === "achats") {
    for (const group of groups) {
      if (!isStockEntreeCharge(group.charge)) continue;
      for (const line of group.produits || []) {
        const produitId = line.produitId;
        const q = parseFloat(line.quantite);
        if (!produitId || !Number.isFinite(q) || q <= 0) continue;
        await tx.produits.update({
          where: { id: produitId },
          data: { stock: { decrement: q } },
        });
      }
    }
  }

  // Inverse STOCK(sortie) : création avait diminué le stock
  if (type === "achats" && isStockSortieFournisseur(fournisseurNom)) {
    for (const group of groups) {
      for (const line of group.produits || []) {
        const produitId = line.produitId;
        const q = parseFloat(line.quantite);
        if (!produitId || !Number.isFinite(q) || q <= 0) continue;
        await tx.produits.update({
          where: { id: produitId },
          data: { stock: { increment: q } },
        });
      }
    }
  }
}

function refundTransactionOnCompte(tx, t) {
  if (!t?.compte || !t?.montant) return Promise.resolve();
  if (t.type === "depense") {
    return tx.comptesBancaires.updateMany({
      where: { compte: t.compte },
      data: { solde: { increment: t.montant } },
    });
  }
  if (t.type === "recette") {
    return tx.comptesBancaires.updateMany({
      where: { compte: t.compte },
      data: { solde: { decrement: t.montant } },
    });
  }
  return Promise.resolve();
}

/**
 * Inverse les règlements liés au BL (paiementBlUnique / paiement fournisseur) :
 * - rembourse le solde pour la part confirmée allouée à ce BL
 * - supprime ou réduit le règlement + ses transactions
 * - ne touche PAS la dette (gérée ensuite via le solde net du BL)
 *
 * @returns {Promise<number>} montant confirmé payé via règlements sur ce BL
 */
async function reverseReglementsLinkedToBl(tx, blId) {
  const allocations = await tx.reglementBlAllocation.findMany({
    where: { bonLivraisonId: blId },
    include: {
      reglement: {
        include: {
          blAllocations: true,
        },
      },
    },
  });

  /** @type {Map<string, { reglement: any, montantAllocBl: number }>} */
  const byReglement = new Map();

  for (const alloc of allocations) {
    const montant = parseFloat(alloc.montant) || 0;
    const existing = byReglement.get(alloc.reglementId);
    if (existing) {
      existing.montantAllocBl += montant;
    } else {
      byReglement.set(alloc.reglementId, {
        reglement: alloc.reglement,
        montantAllocBl: montant,
      });
    }
  }

  // Rétrocompat : règlement lié au BL via reference sans allocation
  const alreadyIds = [...byReglement.keys()];
  const legacyReglements = await tx.reglement.findMany({
    where: {
      reference: blId,
      ...(alreadyIds.length > 0 ? { id: { notIn: alreadyIds } } : {}),
    },
    include: { blAllocations: true },
  });

  for (const reglement of legacyReglements) {
    byReglement.set(reglement.id, {
      reglement,
      montantAllocBl: parseFloat(reglement.montant) || 0,
    });
  }

  let confirmedPaidOnBl = 0;

  for (const [reglementId, { reglement, montantAllocBl }] of byReglement) {
    const isConfirmed = reglement.statusPrelevement === "confirme";
    const otherAllocs = (reglement.blAllocations || []).filter(
      a => a.bonLivraisonId !== blId
    );
    const exclusiveToThisBl = otherAllocs.length === 0;

    if (isConfirmed && montantAllocBl > 0) {
      confirmedPaidOnBl += montantAllocBl;
      if (reglement.compte) {
        await tx.comptesBancaires.updateMany({
          where: { compte: reglement.compte },
          data: { solde: { increment: montantAllocBl } },
        });
      }
    }

    const txWhere = {
      OR: [
        { ReglementId: reglementId },
        { reference: reglementId },
        ...(reglement.chequeId ? [{ chequeId: reglement.chequeId }] : []),
      ],
    };

    if (exclusiveToThisBl) {
      await tx.transactions.deleteMany({ where: txWhere });
      await tx.reglement.delete({ where: { id: reglementId } });
      if (reglement.chequeId) {
        await tx.cheques
          .delete({ where: { id: reglement.chequeId } })
          .catch(() => {});
      }
    } else {
      // Règlement multi-BL : ne retirer que la part de ce BL
      await tx.reglementBlAllocation.deleteMany({
        where: { reglementId, bonLivraisonId: blId },
      });

      const newMontant = Math.max(
        0,
        (parseFloat(reglement.montant) || 0) - montantAllocBl
      );

      const linkedTxs = await tx.transactions.findMany({
        where: {
          OR: [{ ReglementId: reglementId }, { reference: reglementId }],
        },
      });

      for (const t of linkedTxs) {
        const newTxMontant = Math.max(0, (t.montant || 0) - montantAllocBl);
        if (newTxMontant <= 0) {
          await tx.transactions.delete({ where: { id: t.id } });
        } else {
          await tx.transactions.update({
            where: { id: t.id },
            data: { montant: newTxMontant },
          });
        }
      }

      if (newMontant <= 0) {
        await tx.transactions.deleteMany({ where: txWhere });
        await tx.reglement.delete({ where: { id: reglementId } });
        if (reglement.chequeId) {
          await tx.cheques
            .delete({ where: { id: reglement.chequeId } })
            .catch(() => {});
        }
      } else {
        await tx.reglement.update({
          where: { id: reglementId },
          data: { montant: newMontant },
        });
      }
    }
  }

  return confirmedPaidOnBl;
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error?.message?.includes("Access denied")) {
      return NextResponse.json(
        { error: "Accès refusé. Rôle admin requis." },
        { status: 403 }
      );
    }
    if (error?.message?.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    throw error;
  }

  const id = params.id;

  try {
    const result = await prisma.$transaction(
      async tx => {
        const existing = await tx.bonLivraison.findUnique({
          where: { id },
          include: {
            fournisseur: { select: { id: true, nom: true } },
            groups: {
              include: {
                produits: {
                  select: { produitId: true, quantite: true },
                },
              },
            },
          },
        });

        if (!existing) {
          throw new Error("Bon de livraison non trouvé");
        }

        // Source of truth: persisted DB statutPaiement only (ignore query/body)
        if (existing.statutPaiement !== "impaye") {
          throw new Error(
            "Seuls les bons de livraison impayés peuvent être supprimés"
          );
        }

        // Inverser l'effet stock avant suppression (cascade efface les groupes)
        await reverseStockEffectsOnDelete(tx, existing);

        const resolvedFournisseurId = existing.fournisseurId;
        const resolvedType = existing.type;
        const totalNum = parseFloat(existing.total) || 0;

        // 1) Transactions créées à la création du BL (reference = BL.id)
        const linkedTransactions = await tx.transactions.findMany({
          where: { reference: id },
        });
        const paidAtCreate = linkedTransactions.reduce(
          (sum, t) => sum + (parseFloat(t.montant) || 0),
          0
        );

        for (const t of linkedTransactions) {
          await refundTransactionOnCompte(tx, t);
        }
        if (linkedTransactions.length > 0) {
          await tx.transactions.deleteMany({
            where: { reference: id },
          });
        }

        // 2) Règlements / paiements ultérieurs liés au BL
        const confirmedPaidViaReglement = await reverseReglementsLinkedToBl(
          tx,
          id
        );

        // 3) Dette : retirer uniquement ce qui reste encore chargé sur le fournisseur
        //    = total créé en dette − payé à la création − payé confirmé via règlements
        //    (les chèques/traites en_attente n'ont pas touché la dette → bien exclus)
        if (resolvedFournisseurId && resolvedType) {
          if (resolvedType === "achats") {
            const montantEncoreEnDette = Math.max(
              0,
              totalNum - paidAtCreate - confirmedPaidViaReglement
            );
            if (montantEncoreEnDette > 0) {
              await tx.fournisseurs.update({
                where: { id: resolvedFournisseurId },
                data: { dette: { decrement: montantEncoreEnDette } },
              });
            }
          } else if (resolvedType === "retour") {
            await tx.fournisseurs.update({
              where: { id: resolvedFournisseurId },
              data: { dette: { increment: totalNum } },
            });
          }
        }

        const bonLivraison = await tx.bonLivraison.delete({
          where: { id },
        });

        return bonLivraison;
      },
      { timeout: 60_000 }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting BL:", error);
    if (error?.message === "Bon de livraison non trouvé") {
      return NextResponse.json(
        { error: "Bon de livraison non trouvé" },
        { status: 404 }
      );
    }
    if (
      error?.message ===
      "Seuls les bons de livraison impayés peuvent être supprimés"
    ) {
      return NextResponse.json(
        {
          error:
            "Seuls les bons de livraison impayés peuvent être supprimés",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la suppression du bon de livraison" },
      { status: 500 }
    );
  }
}
