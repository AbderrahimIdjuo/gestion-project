import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const { designation, categorieId } = resopns;
    const result = await prisma.items.create({
      data: {
        designation,
        categorieId: categorieId || null,
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
    const { id, designation, categorieId } = resopns;

    const result = await prisma.items.update({
      where: { id },
      data: {
        designation,
        categorieId: categorieId || null,
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
  const filters = {};

  const articlsPerPage = 10;

  // Search filter by designation and category name
  filters.OR = [
    { designation: { contains: searchQuery, mode: "insensitive" } },
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

  // Fetch filtered articls with pagination and related data
  const [articls, totalArticls] = await Promise.all([
    prisma.items.findMany({
      where: filters,
      skip: (page - 1) * articlsPerPage,
      take: articlsPerPage,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        categorieProduits: true,
      },
    }),

    prisma.items.count({ where: filters }), // Get total count for pagination
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalArticls / articlsPerPage);

  // Return the response
  return NextResponse.json({
    articls,
    totalPages,
  });
}
