/** Montant trop élevé ou plus aucun BL à solder pour ce fournisseur après modification. */
export class ReglementMontantInvalideError extends Error {
  constructor(message) {
    const defaultMsg =
      "Montant invalide : ce montant ne peut pas être réparti sur les bons de livraison du fournisseur (tous sont déjà soldés ou le total dépasse le restant à payer).";
    super(message ?? defaultMsg);
    this.name = "ReglementMontantInvalideError";
  }
}

/**
 * Quand le montant d'un règlement change : on annule son effet sur les BL,
 * puis on réalloue le nouveau montant comme un paiement fournisseur
 * (BL « achats » les plus anciens d'abord, sans dépasser le total de chaque BL).
 *
 * - Si des ReglementBlAllocation existent : annulation par chaque ligne
 *   (évite le double retrait si reference existe aussi, ex. paiementBlUnique).
 * - Sinon si reference : on retire l'ancien montant du règlement sur ce BL.
 * - Sans lien BL (ni allocations ni reference) : aucune mise à jour BL.
 */

function statutPaiementFromTotal(totalPaye, total) {
  if (totalPaye <= 0) return "impaye";
  if (totalPaye < total) return "enPartie";
  return "paye";
}

async function syncReglementBlAllocations(tx, reglementId, previousAllocations, nextAllocations) {
  const oldAllocations = previousAllocations ?? [];
  const newAllocations = nextAllocations ?? [];
  const commonLength = Math.min(oldAllocations.length, newAllocations.length);

  for (let index = 0; index < commonLength; index += 1) {
    const oldAlloc = oldAllocations[index];
    const newAlloc = newAllocations[index];

    await tx.reglementBlAllocation.update({
      where: { id: oldAlloc.id },
      data: {
        bonLivraisonId: newAlloc.bonLivraisonId,
        montant: newAlloc.montant,
      },
    });
  }

  if (oldAllocations.length > newAllocations.length) {
    const allocationIdsToDelete = oldAllocations
      .slice(newAllocations.length)
      .map(allocation => allocation.id);

    if (allocationIdsToDelete.length > 0) {
      await tx.reglementBlAllocation.deleteMany({
        where: { id: { in: allocationIdsToDelete } },
      });
    }
  }

  for (const allocation of newAllocations.slice(oldAllocations.length)) {
    await tx.reglementBlAllocation.create({
      data: {
        reglementId,
        bonLivraisonId: allocation.bonLivraisonId,
        montant: allocation.montant,
      },
    });
  }
}

export async function applyReglementMontantChangeToBonLivraisons(
  tx,
  {
    reglementId,
    fournisseurId,
    ancienMontantReglement,
    nouveauMontantReglement,
    reference,
    blAllocations,
  }
) {
  if (nouveauMontantReglement === ancienMontantReglement) return;

  const allocations = blAllocations ?? [];
  const hadBlLink = allocations.length > 0 || Boolean(reference);
  if (!hadBlLink) return;

  // --- Annuler l'effet de ce règlement sur les BL ---
  if (allocations.length > 0) {
    for (const alloc of allocations) {
      const bl = await tx.bonLivraison.findUnique({
        where: { id: alloc.bonLivraisonId },
        select: { id: true, total: true, totalPaye: true },
      });
      if (!bl) continue;
      const nouveauTotalPaye = Math.max(
        0,
        (bl.totalPaye ?? 0) - (alloc.montant ?? 0)
      );
      await tx.bonLivraison.update({
        where: { id: bl.id },
        data: {
          totalPaye: nouveauTotalPaye,
          statutPaiement: statutPaiementFromTotal(nouveauTotalPaye, bl.total),
        },
      });
    }
  } else if (reference) {
    const bl = await tx.bonLivraison.findUnique({
      where: { id: reference },
      select: { id: true, total: true, totalPaye: true },
    });
    if (bl) {
      const nouveauTotalPaye = Math.max(
        0,
        (bl.totalPaye ?? 0) - ancienMontantReglement
      );
      await tx.bonLivraison.update({
        where: { id: bl.id },
        data: {
          totalPaye: nouveauTotalPaye,
          statutPaiement: statutPaiementFromTotal(nouveauTotalPaye, bl.total),
        },
      });
    }
  }

  // --- Réappliquer le nouveau montant (même logique que POST /api/fournisseurs/paiement) ---
  if (nouveauMontantReglement <= 0 || !fournisseurId) {
    await syncReglementBlAllocations(tx, reglementId, allocations, []);
    return;
  }

  let montantRestant = nouveauMontantReglement;
  const nextAllocations = [];

  const bonLivraisonList = await tx.bonLivraison.findMany({
    where: {
      fournisseurId,
      statutPaiement: { in: ["impaye", "enPartie"] },
      type: "achats",
    },
    orderBy: { date: "asc" },
  });

  for (const bl of bonLivraisonList) {
    const totalPayeActuel = bl.totalPaye ?? 0;
    const resteAPayer = Math.max(0, bl.total - totalPayeActuel);

    if (montantRestant <= 0) break;

    let montantAlloue = 0;
    if (montantRestant >= resteAPayer) {
      montantAlloue = resteAPayer;
      montantRestant -= resteAPayer;
      await tx.bonLivraison.update({
        where: { id: bl.id },
        data: {
          totalPaye: bl.total,
          statutPaiement: "paye",
        },
      });
    } else {
      montantAlloue = montantRestant;
      await tx.bonLivraison.update({
        where: { id: bl.id },
        data: {
          totalPaye: { increment: montantRestant },
          statutPaiement: "enPartie",
        },
      });
      montantRestant = 0;
    }

    if (montantAlloue > 0) {
      nextAllocations.push({
        bonLivraisonId: bl.id,
        montant: montantAlloue,
      });
    }
  }

  const resteCentimes = Math.round(montantRestant * 100) / 100;
  if (resteCentimes > 0) {
    throw new ReglementMontantInvalideError(
      `Montant invalide : ${resteCentimes.toFixed(2)} ne peut pas être affecté aux bons de livraison (tous soldés pour ce fournisseur ou montant trop élevé).`
    );
  }

  await syncReglementBlAllocations(tx, reglementId, allocations, nextAllocations);
}
