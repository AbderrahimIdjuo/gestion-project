import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

function buildDateFilter(from, to) {
  if (!from || !to) return null;
  const fromStr = from.includes("T") ? from.slice(0, 10) : from;
  const toStr = to.includes("T") ? to.slice(0, 10) : to;
  const [yF, mF, dF] = fromStr.split("-").map(Number);
  const [yT, mT, dT] = toStr.split("-").map(Number);
  return {
    gte: new Date(Date.UTC(yF, mF - 1, dF, 0, 0, 0, 0)),
    lte: new Date(Date.UTC(yT, mT - 1, dT, 23, 59, 59, 999)),
  };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const sortBy = searchParams.get("sortBy") || "quantite"; // "quantite" ou "montant"

  const dateRange = buildDateFilter(from, to);

  // Exclure les BL de type "retour" (ce ne sont pas des achats)
  const where = {
    NOT: { type: "retour" },
    ...(dateRange && { date: dateRange }),
  };

  const bonLivraisons = await prisma.bonLivraison.findMany({
    where,
    include: {
      groups: {
        include: {
          produits: {
            include: {
              produit: {
                select: {
                  id: true,
                  designation: true,
                  categorieProduits: {
                    select: {
                      categorie: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const stats = {};

  bonLivraisons.forEach(bl => {
    bl.groups.forEach(group => {
      group.produits.forEach(p => {
        if (!p.produit) return;
        const produitId = p.produit.id;
        const quantite = Number(p.quantite) || 0;
        const prixUnite = Number(p.prixUnite) || 0;

        if (!stats[produitId]) {
          stats[produitId] = {
            id: produitId,
            designation: p.produit.designation,
            categorie: p.produit.categorieProduits?.categorie || "-",
            totalQuantite: 0,
            totalMontant: 0,
          };
        }
        stats[produitId].totalQuantite += quantite;
        stats[produitId].totalMontant += quantite * prixUnite;
      });
    });
  });

  const sortKey = sortBy === "montant" ? "totalMontant" : "totalQuantite";
  const produitsPlusAchetes = Object.values(stats)
    .filter(p => p.totalQuantite > 0 || p.totalMontant > 0)
    .sort((a, b) => b[sortKey] - a[sortKey])
    .slice(0, 10);

  return NextResponse.json({
    produitsPlusAchetes,
  });
}
