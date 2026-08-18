import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

/** Fournisseur fictif pour sorties de stock interne — exclu du rapport « tous les fournisseurs » */
const STOCK_SORTIE_FOURNISSEUR_NOM = "STOCK(sortie)";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const statutPaiement = searchParams.get("statutPaiement");
  const type = searchParams.get("type");
  const fournisseurIdParam = searchParams.get("fournisseurId");
  const fournisseurId =
    fournisseurIdParam &&
    fournisseurIdParam !== "null" &&
    fournisseurIdParam !== "undefined"
      ? fournisseurIdParam
      : null;
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

  // ✅ Filtrer par fournisseur ; sans sélection : tous sauf STOCK(sortie)
  if (fournisseurId) {
    filters.fournisseurId = fournisseurId;
  } else {
    filters.fournisseur = {
      nom: { not: STOCK_SORTIE_FOURNISSEUR_NOM },
    };
  }

  // ✅ Filtrer par période : uniquement les BL dont la date est dans l'intervalle [from, to]
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    filters.date = {
      gte: fromDate,
      lte: toDate,
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
