import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const fournisseurId = searchParams.get("fournisseurId");

  // Fetch filtered commandes with pagination and related data
  const [bonLivraisons, transactions] = await Promise.all([
    prisma.bonLivraison.findMany({
      where: { fournisseurId },
      include: {
        groups: {
          include: {
            produits: {
              include: {
                produit: {
                  select: {
                    designation: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.transactions.findMany({
      where: { reference: fournisseurId },
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
    bonLivraisons,
    transactions,
  });
}
