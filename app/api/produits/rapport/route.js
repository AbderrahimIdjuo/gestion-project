import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

function parseIds(param) {
  if (!param || param === "all") return [];
  return param
    .split(",")
    .map(id => id.trim())
    .filter(Boolean);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const entrepotIds = parseIds(searchParams.get("entrepotIds"));
    const categorieIds = parseIds(searchParams.get("categorieIds"));
    const produitIds = parseIds(searchParams.get("produitIds"));

    const stockWhere = {
      quantite: { gt: 0 },
    };
    if (entrepotIds.length > 0) {
      stockWhere.entrepotId = { in: entrepotIds };
    }

    const produitFilter = {};
    if (categorieIds.length > 0) {
      produitFilter.categorieId = { in: categorieIds };
    }
    if (produitIds.length > 0) {
      produitFilter.id = { in: produitIds };
    }

    const stocks = await prisma.produitEntrepot.findMany({
      where: {
        ...stockWhere,
        ...(Object.keys(produitFilter).length > 0
          ? { produit: produitFilter }
          : {}),
      },
      include: {
        produit: {
          include: { categorieProduits: true },
        },
        entrepot: true,
      },
      orderBy: { entrepot: { nom: "asc" } },
    });

    const grouped = new Map();
    for (const row of stocks) {
      const produit = row.produit;
      if (!produit) continue;
      const qty = Number(row.quantite) || 0;
      if (qty <= 0) continue;

      if (!grouped.has(produit.id)) {
        grouped.set(produit.id, {
          id: produit.id,
          reference: produit.reference || "",
          designation: produit.designation,
          categorie: produit.categorieProduits?.categorie || "—",
          unite: produit.Unite || "U",
          prixUnite: Number(produit.prixAchat) || 0,
          quantite: 0,
          valeurStock: 0,
          entrepots: [],
        });
      }

      const item = grouped.get(produit.id);
      item.quantite += qty;
      item.entrepots.push({
        id: row.entrepotId,
        nom: row.entrepot?.nom || "—",
        quantite: qty,
      });
    }

    const produits = Array.from(grouped.values()).map(item => ({
      ...item,
      valeurStock: item.quantite * item.prixUnite,
    }));

    const valeurGlobale = produits.reduce(
      (acc, item) => acc + item.valeurStock,
      0
    );

    return NextResponse.json({
      produits,
      valeurGlobale,
      count: produits.length,
    });
  } catch (error) {
    console.error("GET /api/produits/rapport:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du rapport stock." },
      { status: 500 }
    );
  }
}
