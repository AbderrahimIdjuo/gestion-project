/** 1 centime : évite « enPartie » quand totalPaye ≈ total (flottants). */
export const STATUT_PAIEMENT_EPS = 0.01;

/**
 * Statut dérivé uniquement des montants (source de vérité serveur).
 * @param {number|null|undefined} totalPaye
 * @param {number|null|undefined} total
 * @returns {"impaye"|"enPartie"|"paye"}
 */
export function statutPaiementFromTotals(totalPaye, total) {
  const paye = Number(totalPaye) || 0;
  const tot = Number(total) || 0;
  if (paye <= STATUT_PAIEMENT_EPS) return "impaye";
  if (paye + STATUT_PAIEMENT_EPS < tot) return "enPartie";
  return "paye";
}

/** Reste à payer ; 0 si l'écart est inférieur à 1 centime. */
export function resteAPayer(total, totalPaye) {
  const reste = (Number(total) || 0) - (Number(totalPaye) || 0);
  return reste <= STATUT_PAIEMENT_EPS ? 0 : reste;
}
