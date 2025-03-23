import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const {
      fournisseur,
      designation,
      categorie,
      prixAchat,
      prixVente,
      stock,
      description,
    } = resopns;
    const result = await prisma.produits.create({
      data: {
        fournisseurId: fournisseur?.id || null,
        designation,
        categorie,
        prixAchat,
        prixVente,
        stock,
        description,
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
      fournisseur,
      designation,
      categorie,
      prixAchat,
      prixVente,
      statut,
      stock,
      description,
    } = resopns;

    const result = await prisma.produits.update({
      where: { id },
      data: {
        fournisseurId: fournisseur.id,
        designation,
        categorie,
        prixAchat: parseFloat(prixAchat),
        prixVente: parseFloat(prixVente),
        statut,
        stock: parseInt(stock, 10),
        description,
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
  const minPrixVentes = searchParams.get("minPrixVentes");
  const maxPrixVentes = searchParams.get("maxPrixVentes");
  const minimumStock = searchParams.get("minimumStock");
  const maximumStock = searchParams.get("maximumStock");
  const filters = {};

  const produitsPerPage = 10;

  // Search filter by numero and client name
  filters.OR = [
    { designation: { contains: searchQuery } },
    { categorie: { contains: searchQuery } },
    { description: { contains: searchQuery } },
  ];



 // Filtre par catégorie
if (categorie !== "all") {  
  filters.categorie = { equals: categorie }; // Utilisez "equals" pour une correspondance exacte
}

  // prixVente range filter
  if (minPrixVentes && maxPrixVentes) {
    filters.prixVente = {
      gte: Number(minPrixVentes),
      lte: Number(maxPrixVentes),
    };
  }

  // prixAchat range filter
  if (minPrixAchats && maxPrixAchats) {
    filters.prixAchat = {
      gte: Number(minPrixAchats),
      lte: Number(maxPrixAchats),
    };
  }

   // stock range filter
   if (minimumStock && maximumStock ) {
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
  const [produits, totalProduits, maxPrixAchat, maxPrixVente, maxStock] =
    await Promise.all([
      prisma.produits.findMany({
        where: filters,
        skip: (page - 1) * produitsPerPage,
        take: produitsPerPage,
        orderBy: { createdAt: "desc" },
        include: {
          fournisseur: true,
        },
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
          prixVente: "desc", // Get the commande with the maximum total
        },
        select: {
          prixVente: true, // Only fetch the total field
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
    maxPrixAchat: maxPrixAchat.prixAchat || 0,
    maxPrixVente: maxPrixVente.prixVente || 0,
    maxStock: maxStock.stock || 0,
    totalPages,
  });
}
