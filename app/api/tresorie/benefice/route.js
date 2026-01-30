import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Les paramètres from et to (dates) sont requis." },
      { status: 400 }
    );
  }

  const fromStr = from.includes("T") ? from.slice(0, 10) : from;
  const toStr = to.includes("T") ? to.slice(0, 10) : to;
  const [yF, mF, dF] = fromStr.split("-").map(Number);
  const [yT, mT, dT] = toStr.split("-").map(Number);
  const startDate = new Date(Date.UTC(yF, mF - 1, dF, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(yT, mT - 1, dT, 23, 59, 59, 999));

  const dateFilter = {
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  const [recettesAgg, depensesFixesAgg, depensesVariantesAgg] = await Promise.all([
    prisma.transactions.aggregate({
      where: { ...dateFilter, type: "recette" },
      _sum: { montant: true },
    }),
    prisma.transactions.aggregate({
      where: { ...dateFilter, type: "depense", typeDepense: "fixe" },
      _sum: { montant: true },
    }),
    prisma.transactions.aggregate({
      where: {
        ...dateFilter,
        type: "depense",
        OR: [{ typeDepense: "variante" }, { typeDepense: null }],
      },
      _sum: { montant: true },
    }),
  ]);

  const sumRecettes = recettesAgg._sum.montant ?? 0;
  const sumDepensesFixes = depensesFixesAgg._sum.montant ?? 0;
  const sumDepensesVariantes = depensesVariantesAgg._sum.montant ?? 0;
  const benefice = sumRecettes - sumDepensesFixes - sumDepensesVariantes;

  return NextResponse.json({
    sumRecettes,
    sumDepensesFixes,
    sumDepensesVariantes,
    benefice,
    from: startDate.toISOString(),
    to: endDate.toISOString(),
  });
}
