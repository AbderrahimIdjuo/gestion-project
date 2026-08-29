import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { isCompteCaisse, isCompteProfessionnel } from "@/lib/functions";

function mapBlGroupToChargeRow(group) {
  const montant = (group.produits || []).reduce(
    (sum, produit) => sum + (produit.quantite || 0) * (produit.prixUnite || 0),
    0
  );
  const bl = group.bonLivraison;
  const fournisseurNom = bl?.fournisseur?.nom;
  const descriptionParts = [bl?.numero, fournisseurNom].filter(Boolean);

  return {
    id: `bl-${group.id}`,
    date: bl?.date || bl?.createdAt,
    createdAt: bl?.createdAt,
    lable: group.charge,
    description: descriptionParts.join(" — "),
    compte: null,
    methodePaiement: null,
    montant,
    source: "bl",
  };
}

async function fetchBlChargesFixes(from, to) {
  const blDateFilter =
    from && to
      ? {
          date: {
            gte: new Date(from),
            lte: new Date(to),
          },
        }
      : {};

  const blGroups = await prisma.bLGroups.findMany({
    where: {
      AND: [{ charge: { not: null } }, { NOT: { charge: "" } }],
      bonLivraison: {
        ...blDateFilter,
        NOT: { type: "retour" },
      },
    },
    include: {
      produits: true,
      bonLivraison: {
        select: {
          date: true,
          createdAt: true,
          numero: true,
          fournisseur: { select: { nom: true } },
        },
      },
    },
  });

  return blGroups
    .filter(
      group => typeof group.charge === "string" && group.charge.trim() !== ""
    )
    .map(mapBlGroupToChargeRow);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const compte = searchParams.get("compte") || "all";
  const type = searchParams.get("type") || "all";
  const typeDepense = searchParams.get("typeDepense");
  const from = searchParams.get("from"); // Start date
  const to = searchParams.get("to"); // End date

  const filters = {};

  // Compt filter
  if (compte !== "all") {
    filters.compte = compte;
  }

  // Type filter (ex: depense)
  if (type && type !== "all") {
    filters.type = type;
  }

  // Type de dépense filter (fixe / variante)
  if (typeDepense && typeDepense !== "all") {
    filters.typeDepense = typeDepense;
  }

  // Date range filter
  if (from && to) {
    filters.date = {
      gte: from,
      lte: to,
    };
  }

  const blChargesPromise =
    typeDepense === "fixe" ? fetchBlChargesFixes(from, to) : Promise.resolve([]);

  let transactions;

  if (isCompteProfessionnel(compte)) {
    const [accountTransactions, transfers] = await Promise.all([
      prisma.transactions.findMany({
        where: filters,
        orderBy: { date: "asc" },
      }),
      prisma.transactions.findMany({
        where: {
          type: "transfert",
          ...(filters.date ? { date: filters.date } : {}),
        },
        orderBy: { date: "asc" },
      }),
    ]);

    const ids = new Set(accountTransactions.map(t => t.id));
    transactions = [
      ...accountTransactions,
      ...transfers.filter(t => !ids.has(t.id)),
    ];
  } else if (isCompteCaisse(compte)) {
    const includeAllVider = !filters.type || filters.type === "vider";
    const [accountTransactions, viders] = await Promise.all([
      prisma.transactions.findMany({
        where: filters,
        orderBy: { date: "asc" },
      }),
      includeAllVider
        ? prisma.transactions.findMany({
            where: {
              type: "vider",
              ...(filters.date ? { date: filters.date } : {}),
            },
            orderBy: { date: "asc" },
          })
        : Promise.resolve([]),
    ]);

    const ids = new Set(accountTransactions.map(t => t.id));
    transactions = [
      ...accountTransactions,
      ...viders.filter(t => !ids.has(t.id)),
    ];
  } else {
    transactions = await prisma.transactions.findMany({
      where: filters,
      orderBy: { date: "asc" },
    });
  }

  if (typeDepense === "fixe") {
    const blCharges = await blChargesPromise;
    transactions = [...transactions, ...blCharges].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateA - dateB;
    });
  }

  const comptes = await prisma.comptesBancaires.findMany();

  return NextResponse.json({ transactions, comptes });
}
