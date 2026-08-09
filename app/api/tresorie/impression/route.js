import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get("query") || "";
  const compte = searchParams.get("compte") || "all";
  const type = searchParams.get("type") || "all";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const fournisseurId = searchParams.get("fournisseurId");
  const methodePaiement = searchParams.get("methodePaiement") || "all";
  const typeDepense = searchParams.get("typeDepense") || "all";

  const filters = {};

  // Search filter
  filters.OR = [
    { reference: { contains: searchQuery, mode: "insensitive" } },
    { description: { contains: searchQuery, mode: "insensitive" } },
    { lable: { contains: searchQuery, mode: "insensitive" } },
  ];

  // Type filter (supports multiple values separated by "-")
  if (type && type !== "all") {
    const typeArray = type.split("-").filter(Boolean);
    if (typeArray.length > 0) {
      filters.type = { in: typeArray };
    }
  }

  // Compte filter (supports multiple values separated by "-")
  if (compte && compte !== "all") {
    const compteArray = compte.split("-").filter(Boolean);
    if (compteArray.length > 0) {
      filters.compte = { in: compteArray };
    }
  }

  // Methode de paiement filter (supports multiple values separated by "-")
  if (methodePaiement && methodePaiement !== "all") {
    const methodePaiementArray = methodePaiement.split("-").filter(Boolean);
    if (methodePaiementArray.length > 0) {
      filters.methodePaiement = { in: methodePaiementArray };
    }
  }

  // type de depense filter (supports multiple values separated by "-", including sansType for null)
  if (typeDepense && typeDepense !== "all") {
    if (typeDepense === "charges") {
      filters.typeDepense = {
        in: ["fixe", "variante"],
      };
    } else {
      const typeDepenseArray = typeDepense.split("-").filter(Boolean);
      const hasSansType = typeDepenseArray.includes("sansType");
      const stringTypes = typeDepenseArray.filter(t => t !== "sansType");

      if (hasSansType && stringTypes.length > 0) {
        filters.AND = [
          ...(filters.AND || []),
          {
            OR: [
              { typeDepense: { in: stringTypes } },
              { typeDepense: null },
            ],
          },
        ];
      } else if (hasSansType) {
        filters.typeDepense = null;
      } else if (stringTypes.length === 1) {
        filters.typeDepense = stringTypes[0];
      } else if (stringTypes.length > 1) {
        filters.typeDepense = { in: stringTypes };
      }
    }
  }

  // Date range filter
  if (from && to) {
    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    filters.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  // Fournisseur filter
  if (fournisseurId) {
    filters.reference = fournisseurId;
  }

  const transactions = await prisma.transactions.findMany({
    where: filters,
    orderBy: { date: "desc" },
    include: {
      cheque: true,
    },
  });

  return NextResponse.json({ transactions });
}
