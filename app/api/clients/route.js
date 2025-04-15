import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const resopns = await req.json();
    const { nom, email, telephone, adresse } = resopns;
    const result = await prisma.clients.create({
      data: {
        nom,
        email,
        telephone,
        adresse,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT") {
      return NextResponse.json(
        {
          message:
            "Duplicate field error: A record with this value already exists.",
        },
        { status: 409 }
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
    const { id, nom, email, telephone, adresse } = resopns;
    const result = await prisma.clients.update({
      where: { id },
      data: {
        nom,
        email,
        telephone,
        adresse,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          message:
            "Duplicate field error: A record with this value already exists.",
        },
        { status: 409 }
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

  const filters = {};

  const clientsPerPage = 10;

  // Search filter by numero and client name
  filters.OR = [
    { nom: { contains: searchQuery } },
    { adresse: { contains: searchQuery } },
    { telephone: { contains: searchQuery } },
    { email: { contains: searchQuery } },
  ];

  // Fetch filtered commandes with pagination and related data
  const [clients, totalClients] = await Promise.all([
    prisma.clients.findMany({
      where: filters,
      skip: (page - 1) * clientsPerPage,
      take: clientsPerPage,
      orderBy: { createdAt: "desc" },
    }),
    prisma.clients.count({ where: filters }), // Get total count for pagination
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalClients / clientsPerPage);

  // Return the response
  return NextResponse.json({
    clients,
    totalPages,
  });
}
