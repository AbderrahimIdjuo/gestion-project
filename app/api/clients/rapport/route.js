import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // Start date
  const to = searchParams.get("to"); // End date
  const filters = {};

  // Date range filter
  if (from && to) {
    filters.date = {
      gte: from,
      lte: to,
    };
  }
  // Fetch the liste of devis withe dette > 0
  const devis = await prisma.devis.findMany({
    where: {
      statut: { in: ["Accepté", "Terminer"] },
      statutPaiement: { in: ["impaye", "enPartie"] },
      ...filters,
    },
    include: {
      client: true,
    },
  });

  const devisNumero = devis.map(c => c.numero);

  const transactions = await prisma.transactions.findMany({
    where: { reference: { in: devisNumero } },
  });

  return NextResponse.json({
    devis,
    transactions,
  });
}
