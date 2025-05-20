import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const { designation, categorie, prixAchat, stock, description, reference } =
      resopns;
    const result = await prisma.produits.create({
      data: {
        designation,
        categorie,
        prixAchat,
        stock,
        description,
        reference,
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
    const {
      id,
      designation,
      categorie,
      prixAchat,
      statut,
      stock,
      description,
      reference,
    } = resopns;

    const result = await prisma.produits.update({
      where: { id },
      data: {
        designation,
        categorie,
        prixAchat: parseFloat(prixAchat),
        statut,
        stock: parseInt(stock, 10),
        description,
        reference,
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
  const statut = searchParams.get("statut");
  const categorie = searchParams.get("categorie");
  const minPrixAchats = searchParams.get("minPrixAchats");
  const maxPrixAchats = searchParams.get("maxPrixAchats");
  const minimumStock = searchParams.get("minimumStock");
  const maximumStock = searchParams.get("maximumStock");
  const filters = {};

  const produitsPerPage = 10;

  // Search filter by numero and client name
  filters.OR = [
    { designation: { contains: searchQuery, mode: "insensitive" } },
    { categorie: { contains: searchQuery, mode: "insensitive" } },
    { description: { contains: searchQuery, mode: "insensitive" } },
  ];

  // Filtre par catégorie
  if (categorie !== "all") {
    console.log("categorie", categorie);

    filters.categorie = { equals: categorie }; // Utilisez "equals" pour une correspondance exacte
  }
  // prixAchat range filter
  if (minPrixAchats && maxPrixAchats) {
    filters.prixAchat = {
      gte: Number(minPrixAchats),
      lte: Number(maxPrixAchats),
    };
  }

  // stock range filter
  if (minimumStock && maximumStock) {
    filters.stock = {
      gte: Number(minimumStock),
      lte: Number(maximumStock),
    };
  }

  // Statut filter
  if (statut !== "all") {
    switch (statut) {
      case "En stock":
        filters.stock = {
          gte: 20,
        };
        break;
      case "Limité":
        filters.stock = {
          gt: 0,
          lt: 20,
        };
        break;
      case "En rupture":
        filters.stock = 0;
        break;
      default:
        break;
    }
  }

  // Fetch filtered commandes with pagination and related data
  const [produits, totalProduits, maxPrixAchat, maxStock] = await Promise.all([
    prisma.produits.findMany({
      where: filters,
      skip: (page - 1) * produitsPerPage,
      take: produitsPerPage,
      orderBy: { createdAt: "desc" },
    }),

    prisma.produits.count({ where: filters }), // Get total count for pagination
    prisma.produits.findFirst({
      orderBy: {
        prixAchat: "desc", // Get the commande with the maximum total
      },
      select: {
        prixAchat: true, // Only fetch the total field
      },
    }),
    prisma.produits.findFirst({
      orderBy: {
        stock: "desc", // Get the commande with the maximum total
      },
      select: {
        stock: true, // Only fetch the total field
      },
    }),
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalProduits / produitsPerPage);

  // Return the response
  return NextResponse.json({
    produits,
    totalProduits,
    maxPrixAchat: maxPrixAchat?.prixAchat || 0,
    maxStock: maxStock?.stock || 0,
    totalPages,
  });
}
