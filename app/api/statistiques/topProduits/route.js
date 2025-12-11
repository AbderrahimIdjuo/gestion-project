import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const sortBy = searchParams.get("sortBy") || "quantite"; // "quantite" ou "montant"

  const filters = {};
  if (from && to) {
    filters.date = {
      gte: from, // Greater than or equal to "from"
      lte: to, // Less than or equal to "to"
    };
  }
  // Récupérer les produits les plus achetés
  const produitsPlusAchetes = await prisma.bonLivraison
    .findMany({
      where: filters.date
        ? {
            date: {
              gte: from,
              lte: to,
            },
          }
        : {},
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
    })
    .then(bonLivraisons => {
      // Calculer les statistiques des produits
      const stats = {};

      bonLivraisons.forEach(bl => {
        bl.groups.forEach(group => {
          group.produits.forEach(p => {
            const produitId = p.produit.id;
            if (!stats[produitId]) {
              stats[produitId] = {
                id: produitId,
                designation: p.produit.designation,
                categorie: p.produit.categorieProduits?.categorie || "-",
                totalQuantite: 0,
                totalMontant: 0,
              };
            }
            stats[produitId].totalQuantite += p.quantite;
            stats[produitId].totalMontant += p.quantite * p.prixUnite;
          });
        });
      });

      // Trier selon le critère choisi et prendre les 10 premiers
      const sortKey = sortBy === "montant" ? "totalMontant" : "totalQuantite";
      return Object.values(stats)
        .sort((a, b) => b[sortKey] - a[sortKey])
        .slice(0, 10);
    });
  return NextResponse.json({
    produitsPlusAchetes,
  });
}
