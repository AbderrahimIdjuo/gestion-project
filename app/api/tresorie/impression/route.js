import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get("query") || "";
  const compte = searchParams.get("compte") || "all";
  const type = searchParams.get("type") || "all";
  const from = searchParams.get("from"); // Start date
  const to = searchParams.get("to"); // End date
  const fournisseurId = searchParams.get("fournisseurId");
  const methodePaiement = searchParams.get("methodePaiement");
  const typeDepense = searchParams.get("typeDepense");

  const filters = {};

  // Search filter
  filters.OR = [
    { reference: { contains: searchQuery, mode: "insensitive" } },
    { description: { contains: searchQuery, mode: "insensitive" } },
  ];
  // Type filter
  if (type !== "all") {
    filters.type = type;
  }

  // Compt filter
  if (compte !== "all") {
    filters.compte = compte;
  }

  // methode de paiement filter
  if (methodePaiement !== "all") {
    filters.methodePaiement = methodePaiement;
  }
  // type de depense filter
  if (typeDepense !== "all") {
    if (typeDepense !== "charges") {
      filters.typeDepense = typeDepense;
    } else if (typeDepense === "charges") {
      filters.typeDepense = {
        in: ["fixe", "variante"],
      };
    }
  }
  // Date range filter
  if (from && to) {
    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0); // Set to beginning of the day

    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999); // Set to end of the day

    filters.date = {
      gte: startDate, // Greater than or equal to start of "from" day
      lte: endDate, // Less than or equal to end of "to" day
    };
  }

  // Fournisseur filter
  if (fournisseurId) {
    filters.reference = fournisseurId;
  }

  // Fetch filtered transactions with pagination
  const transactions = await prisma.transactions.findMany({
    where: filters,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ transactions });
}
