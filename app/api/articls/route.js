import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const { designation  , categorie} = resopns;
    const result = await prisma.items.create({
      data: {
        designation,
        categorie
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
    const { id, designation , categorie } = resopns;

    const result = await prisma.items.update({
      where: { id },
      data: {
        designation,
        categorie
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
  const filters = {};

  const articlsPerPage = 10;

  // Search filter by numero and client name
  filters.OR = [
    { designation: { contains: searchQuery, mode: "insensitive" } },
  ];

  // Fetch filtered articls with pagination and related data
  const [articls, totalArticls] = await Promise.all([
    prisma.items.findMany({
      where: filters,
      skip: (page - 1) * articlsPerPage,
      take: articlsPerPage,
      orderBy: {
        createdAt: "desc",
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
