import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  // Fetch filtered commandes with pagination and related data
  const [devis, transactions] = await Promise.all([
    prisma.devis.findMany({
      where: { clientId },
    }),
    prisma.transactions.findMany({
      where: { clientId },
      include: {
        cheque: true,
      },
      orderBy: {
        date: "desc",
      },
    }),
  ]);

  // Return the response
  return NextResponse.json({
    devis,
    transactions,
  });
}
