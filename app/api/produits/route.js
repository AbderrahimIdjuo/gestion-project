import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { applyStockDelta, isStockError, setStockQuantite } from "@/lib/stock";
export const dynamic = "force-dynamic";

const stocksEntrepotInclude = {
  stocksEntrepot: {
    include: { entrepot: true },
    orderBy: { entrepot: { nom: "asc" } },
  },
};

export async function POST(req) {
  try {
    const resopns = await req.json();
    const {
      designation,
      categorieId,
      prixAchat,
      unite,
      reference,
      stock,
      entrepotId,
    } = resopns;
    const stockVal = parseFloat(stock) || 0;
    if (stockVal > 0 && !entrepotId) {
      return NextResponse.json(
        { message: "Sélectionnez un entrepôt pour le stock initial." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async tx => {
      const produit = await tx.produits.create({
        data: {
          designation,
          categorieId: categorieId || null,
          prixAchat,
          Unite: unite || "U",
          reference,
          stock: 0,
        },
      });
      if (stockVal > 0) {
        await applyStockDelta(tx, {
          produitId: produit.id,
          entrepotId,
          delta: stockVal,
        });
      }
      return tx.produits.findUnique({ where: { id: produit.id } });
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error adding product:", error);
    if (isStockError(error)) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status || 400 }
      );
    }
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const resopns = await req.json();
    const {
      id,
      designation,
      categorieId,
      prixAchat,
      unite,
      reference,
      stocksEntrepot,
    } = resopns;

    const result = await prisma.$transaction(async tx => {
      await tx.produits.update({
        where: { id },
        data: {
          designation,
          categorieId: categorieId || null,
          prixAchat: parseFloat(prixAchat),
          Unite: unite,
          reference,
        },
      });

      if (Array.isArray(stocksEntrepot)) {
        for (const row of stocksEntrepot) {
          if (!row?.entrepotId) continue;
          await setStockQuantite(tx, {
            produitId: id,
            entrepotId: row.entrepotId,
            quantite: row.quantite,
          });
        }
      }

      return tx.produits.findUnique({
        where: { id },
        include: stocksEntrepotInclude,
      });
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error updating product:", error);
    if (isStockError(error)) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status || 400 }
      );
    }
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
  const entrepotId = searchParams.get("entrepotId");
  const minPrixAchats = searchParams.get("minPrixAchats");
  const maxPrixAchats = searchParams.get("maxPrixAchats");
  const minStockParam = searchParams.get("minStock");
  const maxStockParam = searchParams.get("maxStock");

  const filters = {};

  const produitsPerPage = 10;

  filters.OR = [
    { designation: { contains: searchQuery, mode: "insensitive" } },
    { reference: { contains: searchQuery, mode: "insensitive" } },
    {
      categorieProduits: {
        categorie: { contains: searchQuery, mode: "insensitive" },
      },
    },
  ];

  if (categorie && categorie !== "all") {
    filters.categorieId = categorie;
  }

  if (entrepotId && entrepotId !== "all") {
    filters.stocksEntrepot = {
      some: { entrepotId },
    };
  }

  if (minPrixAchats && maxPrixAchats) {
    filters.prixAchat = {
      gte: Number(minPrixAchats),
      lte: Number(maxPrixAchats),
    };
  }

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

  const [produits, totalProduits, maxPrixAchat, stockAgg] = await Promise.all([
    prisma.produits.findMany({
      where: filters,
      skip: (page - 1) * produitsPerPage,
      take: produitsPerPage,
      orderBy: { createdAt: "desc" },
      include: {
        categorieProduits: true,
        ...stocksEntrepotInclude,
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
      _min: { stock: true },
    }),
  ]);

  const totalPages = Math.ceil(totalProduits / produitsPerPage);

  return NextResponse.json({
    produits,
    totalProduits,
    maxPrixAchat: maxPrixAchat?.prixAchat || 0,
    maxStock: stockAgg._max.stock ?? 0,
    minStock: stockAgg._min.stock ?? 0,
    totalPages,
  });
}
