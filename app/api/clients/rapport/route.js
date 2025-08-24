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
      statut: "Accepté",
      statutPaiement: { in: ["impaye", "enPartie"] },
      ...filters,
    },
    include: {
      client: true,
    },
  });

  return NextResponse.json({
    devis,
  });
}
