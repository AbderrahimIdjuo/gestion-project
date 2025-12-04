import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const { designation, categorie, prixAchat, unite, reference } = resopns;
    const result = await prisma.produits.create({
      data: {
        designation,
        categorie,
        prixAchat,
        Unite: unite || "U",
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
    const { id, designation, categorie, prixAchat, unite, reference } =
      resopns;

    const result = await prisma.produits.update({
      where: { id },
      data: {
        designation,
        categorie,
        prixAchat: parseFloat(prixAchat),
        Unite: unite,
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
  const categorie = searchParams.get("categorie");
  const minPrixAchats = searchParams.get("minPrixAchats");
  const maxPrixAchats = searchParams.get("maxPrixAchats");

  const filters = {};

  const produitsPerPage = 10;

  // Search filter by numero and client name
  filters.OR = [
    { designation: { contains: searchQuery, mode: "insensitive" } },
    { categorie: { contains: searchQuery, mode: "insensitive" } },
    { reference: { contains: searchQuery, mode: "insensitive" } },
  ];

  // Filtre par catégorie
  if (categorie !== "all") {
    filters.categorie = { equals: categorie, mode: "insensitive" };
  }
  // prixAchat range filter
  if (minPrixAchats && maxPrixAchats) {
    filters.prixAchat = {
      gte: Number(minPrixAchats),
      lte: Number(maxPrixAchats),
    };
  }

  // Fetch filtered commandes with pagination and related data
  const [produits, totalProduits, maxPrixAchat] = await Promise.all([
    prisma.produits.findMany({
      where: filters,
      skip: (page - 1) * produitsPerPage,
      take: produitsPerPage,
      orderBy: { createdAt: "desc" },
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
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalProduits / produitsPerPage);

  // Return the response
  return NextResponse.json({
    produits,
    totalProduits,
    maxPrixAchat: maxPrixAchat?.prixAchat || 0,
    totalPages,
  });
}
