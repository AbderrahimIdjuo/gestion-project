import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const { designation, categorieId, prixAchat, unite, reference, stock } =
      resopns;
    const result = await prisma.produits.create({
      data: {
        designation,
        categorieId: categorieId || null,
        prixAchat,
        Unite: unite || "U",
        reference,
        stock: stock || 0,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const resopns = await req.json();
    const { id, designation, categorieId, prixAchat, unite, reference, stock } =
      resopns;

    const result = await prisma.produits.update({
      where: { id },
      data: {
        designation,
        categorieId: categorieId || null,
        prixAchat: parseFloat(prixAchat),
        Unite: unite,
        reference,
        stock: stock || 0,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("query") || "";
  const categorie = searchParams.get("categorie");
  const minPrixAchats = searchParams.get("minPrixAchats");
  const maxPrixAchats = searchParams.get("maxPrixAchats");
  const minStockParam = searchParams.get("minStock");
  const maxStockParam = searchParams.get("maxStock");

  const filters = {};

  const produitsPerPage = 10;

  // Search filter by designation, reference, and category name
  filters.OR = [
    { designation: { contains: searchQuery, mode: "insensitive" } },
    { reference: { contains: searchQuery, mode: "insensitive" } },
    {
      categorieProduits: {
        categorie: { contains: searchQuery, mode: "insensitive" },
      },
    },
  ];

  // Filtre par catégorie (utilise maintenant categorieId)
  if (categorie && categorie !== "all") {
    filters.categorieId = categorie;
  }
  // prixAchat range filter
  if (minPrixAchats && maxPrixAchats) {
    filters.prixAchat = {
      gte: Number(minPrixAchats),
      lte: Number(maxPrixAchats),
    };
  }

  // Plage de stock (null compté comme 0 si la plage inclut 0)
  if (
    minStockParam != null &&
    maxStockParam != null &&
    minStockParam !== "" &&
    maxStockParam !== ""
  ) {
    const minS = Number(minStockParam);
    const maxS = Number(maxStockParam);
    if (!Number.isNaN(minS) && !Number.isNaN(maxS)) {
      const zeroInRange = minS <= 0 && maxS >= 0;
      const orBranches = [{ stock: { gte: minS, lte: maxS } }];
      if (zeroInRange) {
        orBranches.push({ stock: null });
      }
      filters.AND = [...(filters.AND || []), { OR: orBranches }];
    }
  }

  // Fetch filtered commandes with pagination and related data
  const [produits, totalProduits, maxPrixAchat, stockAgg] = await Promise.all([
    prisma.produits.findMany({
      where: filters,
      skip: (page - 1) * produitsPerPage,
      take: produitsPerPage,
      orderBy: { createdAt: "desc" },
      include: {
        categorieProduits: true,
      },
    }),

    prisma.produits.count({ where: filters }),
    prisma.produits.findFirst({
      orderBy: {
        prixAchat: "desc",
      },
      select: {
        prixAchat: true,
      },
    }),
    prisma.produits.aggregate({
      _max: { stock: true },
    }),
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalProduits / produitsPerPage);

  // Return the response
  return NextResponse.json({
    produits,
    totalProduits,
    maxPrixAchat: maxPrixAchat?.prixAchat || 0,
    maxStock: stockAgg._max.stock ?? 0,
    totalPages,
  });
}
