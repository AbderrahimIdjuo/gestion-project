import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const statutPaiement = searchParams.get("statutPaiement");
  const type = searchParams.get("type");
  const fournisseurId = searchParams.get("fournisseurId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const filters = {};

  const statutPaiementArray =
    statutPaiement && statutPaiement.trim() !== ""
      ? statutPaiement.split("-")
      : [];

  // ✅ Filtres multi-statuts
  if (statutPaiementArray && statutPaiementArray.length > 0) {
    filters.statutPaiement = {
      in: statutPaiementArray,
    };
  }

  // ✅ Filtrer par type
  if (type && type !== "tous") {
    filters.type = type;
  }

  // ✅ Filtrer par fournisseur
  if (fournisseurId) {
    filters.fournisseurId = fournisseurId;
  }

  // ✅ Filtrer par période (createdAt entre from et to)
  console.log("/api/bonLivraison/rapport ###   from", from, "to", to);

  if (from && to) {
    filters.date = {
      gte: new Date(from),
      lte: new Date(to),
    };
  }

  // Fetch filtered BL
  const bonLivraison = await prisma.bonLivraison.findMany({
    where: filters,
    orderBy: { date: "desc" },
    include: {
      fournisseur: {
        select: {
          nom: true,
        },
      },
      groups: {
        include: {
          produits: {
            include: {
              produit: {
                select: {
                  designation: true,
                  prixAchat: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Return the response
  return NextResponse.json({
    bonLivraison,
  });
}
