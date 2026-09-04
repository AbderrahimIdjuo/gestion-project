export class StockError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "StockError";
    this.status = status;
  }
}

/** Charge groupe BL : réception en magasin */
export const STOCK_ENTREE_CHARGE_NOM = "STOCK(entrée)";

/** Fournisseur fictif pour sorties de stock interne */
export const STOCK_SORTIE_FOURNISSEUR_NOM = "STOCK(sortie)";

export function isStockEntreeCharge(charge) {
  if (typeof charge !== "string") return false;
  const normalized = charge
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return normalized === "stock(entree)";
}

export function isStockSortieFournisseur(nom) {
  return typeof nom === "string" && nom.trim() === STOCK_SORTIE_FOURNISSEUR_NOM;
}

export function isStockError(error) {
  return error instanceof StockError || error?.name === "StockError";
}

/**
 * Adjust quantity for a product in a warehouse and keep Produits.stock in sync.
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 */
export async function applyStockDelta(tx, { produitId, entrepotId, delta }) {
  const d = parseFloat(delta);
  if (!produitId) {
    throw new StockError("Produit requis pour le mouvement de stock.");
  }
  if (!Number.isFinite(d) || d === 0) {
    return;
  }
  if (!entrepotId) {
    throw new StockError("Entrepôt requis pour le mouvement de stock.");
  }

  const existing = await tx.produitEntrepot.findUnique({
    where: {
      produitId_entrepotId: { produitId, entrepotId },
    },
  });

  const current = existing?.quantite ?? 0;
  const next = current + d;
  if (next < -0.0001) {
    throw new StockError("Stock insuffisant dans cet entrepôt.");
  }

  const quantite = Math.max(0, next);

  if (existing) {
    await tx.produitEntrepot.update({
      where: { id: existing.id },
      data: { quantite },
    });
  } else {
    await tx.produitEntrepot.create({
      data: { produitId, entrepotId, quantite },
    });
  }

  const p = await tx.produits.findUnique({
    where: { id: produitId },
    select: { stock: true },
  });
  if (!p) {
    throw new StockError("Produit introuvable.", 404);
  }
  await tx.produits.update({
    where: { id: produitId },
    data: { stock: (p.stock ?? 0) + d },
  });
}

/**
 * Set the absolute quantity of a product in a warehouse.
 */
export async function setStockQuantite(tx, { produitId, entrepotId, quantite }) {
  const q = parseFloat(quantite);
  if (!produitId || !entrepotId) {
    throw new StockError("Produit et entrepôt requis.");
  }
  if (!Number.isFinite(q) || q < 0) {
    throw new StockError("Quantité invalide.");
  }
  const existing = await tx.produitEntrepot.findUnique({
    where: {
      produitId_entrepotId: { produitId, entrepotId },
    },
  });
  const current = existing?.quantite ?? 0;
  await applyStockDelta(tx, {
    produitId,
    entrepotId,
    delta: q - current,
  });
}

/**
 * Move quantity from one warehouse to another and record the transfer.
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 */
export async function transferStock(
  tx,
  { produitId, entrepotSourceId, entrepotDestId, quantite }
) {
  const q = parseFloat(quantite);
  if (!produitId || !entrepotSourceId || !entrepotDestId) {
    throw new StockError("Produit et entrepôts requis.");
  }
  if (entrepotSourceId === entrepotDestId) {
    throw new StockError(
      "L'entrepôt source et l'entrepôt destination doivent être différents."
    );
  }
  if (!Number.isFinite(q) || q <= 0) {
    throw new StockError("Quantité de transfert invalide.");
  }

  await applyStockDelta(tx, {
    produitId,
    entrepotId: entrepotSourceId,
    delta: -q,
  });
  await applyStockDelta(tx, {
    produitId,
    entrepotId: entrepotDestId,
    delta: q,
  });

  await tx.transfertsStock.create({
    data: {
      produitId,
      entrepotSourceId,
      entrepotDestId,
      quantite: q,
    },
  });
}

export async function resolveEntrepotIdOrPrincipal(tx, entrepotId) {
  if (entrepotId) return entrepotId;
  const principal = await tx.entrepots.findUnique({
    where: { nom: "Entrepôt principal" },
    select: { id: true },
  });
  return principal?.id ?? null;
}
