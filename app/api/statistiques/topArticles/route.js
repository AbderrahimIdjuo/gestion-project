import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const sortBy = searchParams.get("sortBy") || "quantite"; // "quantite" ou "montant"

  const filters = {
    statutPaiement: { in: ["paye", "enPartie"] },
    ...(from &&
      to && {
        date: {
          gte: from,
          lte: to,
        },
      }),
  };
  const articlesPlusVendus = await prisma.devis
    .findMany({
      where: filters,
      include: {
        articls: true,
      },
    })
    .then(devis => {
      // Calculer les statistiques des articles
      const stats = {};

      devis.forEach(devi => {
        devi.articls.forEach(article => {
          const articleDesignation = article.designation;
          if (!stats[articleDesignation]) {
            stats[articleDesignation] = {
              id: article.id,
              designation: article.designation,
              unite: article.unite,
              key: article.key,
              totalQuantite: 0,
              totalMontant: 0,
            };
          }
          stats[articleDesignation].totalQuantite += article.quantite;
          stats[articleDesignation].totalMontant += article.montant;
        });
      });

      // Trier selon le critère choisi et prendre les 10 premiers
      const sortKey = sortBy === "montant" ? "totalMontant" : "totalQuantite";
      return Object.values(stats)
        .sort((a, b) => b[sortKey] - a[sortKey])
        .slice(0, 10);
    });
  return NextResponse.json({
    articlesPlusVendus,
  });
}
