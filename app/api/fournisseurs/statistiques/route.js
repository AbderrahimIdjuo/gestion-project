import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const fournisseurId = searchParams.get("fournisseurId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Construire le filtre pour les bonLivraisons
  const bonLivraisonFilter = { fournisseurId };
  
  // Ajouter le filtre de date si fourni
  if (from || to) {
    bonLivraisonFilter.date = {};
    if (from) {
      const startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      bonLivraisonFilter.date.gte = startDate;
    }
    if (to) {
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      bonLivraisonFilter.date.lte = endDate;
    }
  }

  // Fetch filtered commandes with pagination and related data
  const [bonLivraisons, reglements] = await Promise.all([
    prisma.bonLivraison.findMany({
      where: bonLivraisonFilter,
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
      orderBy: {
        date: "desc",
      },
    }),
    prisma.reglement.findMany({
      where: { fournisseurId },
      include: {
        cheque: {
          select: {
            id: true,
            numero: true,
            dateReglement: true,
            datePrelevement: true,
          },
        },
        fournisseur: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: {
        dateReglement: "desc",
      },
    }),
  ]);

  // Return the response
  return NextResponse.json({
    bonLivraisons,
    reglements,
  });
}
