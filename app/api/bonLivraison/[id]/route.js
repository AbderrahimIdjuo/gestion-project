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
  const url = new URL(request.url);
  const fournisseurId = url.searchParams.get("fournisseurId");
  const type = url.searchParams.get("type");

  try {
    const result = await prisma.$transaction(async tx => {
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

      // Inverser l'effet stock avant suppression (cascade efface les groupes)
      await reverseStockEffectsOnDelete(tx, existing);

      const bonLivraison = await tx.bonLivraison.delete({
        where: { id },
      });

      const resolvedFournisseurId = fournisseurId || existing.fournisseurId;
      const resolvedType = type || existing.type;

      if (resolvedFournisseurId && resolvedType) {
        const detteDelta =
          resolvedType === "achats"
            ? { decrement: bonLivraison.total }
            : resolvedType === "retour"
              ? { increment: bonLivraison.total }
              : undefined;

        if (detteDelta) {
          await tx.fournisseurs.update({
            where: { id: resolvedFournisseurId },
            data: { dette: detteDelta },
          });
        }
      }

      return bonLivraison;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting BL:", error);
    if (error?.message === "Bon de livraison non trouvé") {
      return NextResponse.json(
        { error: "Bon de livraison non trouvé" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la suppression du bon de livraison" },
      { status: 500 }
    );
  }
}
