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

  // Uniquement les devis Accepté / Terminer (ventes confirmées)
  const where = {
    statut: { in: ["Accepté", "Terminer"] },
    ...(dateRange && {
      OR: [
        { date: dateRange },
        { date: null, createdAt: dateRange },
      ],
    }),
  };

  const devis = await prisma.devis.findMany({
    where,
    include: {
      articls: true,
    },
  });

  const stats = {};

  devis.forEach(devi => {
    devi.articls.forEach(article => {
      const designation = (article.designation || "").trim();
      if (!designation) return;

      const quantite = Number(article.quantite) || 0;
      // montant stocké = quantite * prixUnite ; fallback si montant absent
      const montant =
        Number(article.montant) ||
        quantite * (Number(article.prixUnite) || 0);

      if (!stats[designation]) {
        stats[designation] = {
          id: designation,
          designation,
          unite: article.unite,
          totalQuantite: 0,
          totalMontant: 0,
        };
      }
      stats[designation].totalQuantite += quantite;
      stats[designation].totalMontant += montant;
    });
  });

  const sortKey = sortBy === "montant" ? "totalMontant" : "totalQuantite";
  const articlesPlusVendus = Object.values(stats)
    .filter(a => a.totalQuantite > 0 || a.totalMontant > 0)
    .sort((a, b) => b[sortKey] - a[sortKey])
    .slice(0, 10);

  return NextResponse.json({
    articlesPlusVendus,
  });
}
