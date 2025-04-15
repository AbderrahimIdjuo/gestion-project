import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const resopns = await req.json();
    const { nom, email, telephone, adresse, ice, telephoneSecondaire } =
      resopns;
    const result = await prisma.fournisseurs.create({
      data: {
        nom,
        email,
        telephone,
        adresse,
        ice,
        telephoneSecondaire,
      },
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const resopns = await req.json();
    const { id, nom, email, telephone, adresse, ice, telephoneSecondaire } =
      resopns;
    const result = await prisma.fournisseurs.update({
      where: { id },
      data: {
        nom,
        email,
        telephone,
        adresse,
        ice,
        telephoneSecondaire,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// export async function GET() {
//   const Fournisseurs = await prisma.fournisseurs.findMany({
//     orderBy: {
//       updatedAt: "desc",
//     },
//   });
//   return NextResponse.json({ Fournisseurs });
// }

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("query") || "";

  const filters = {};

  const fournisseursPerPage = 10;

  // Search filter by numero and client name
  filters.OR = [
    { nom: { contains: searchQuery } },
    { adresse: { contains: searchQuery } },
    { telephone: { contains: searchQuery } },
    { email: { contains: searchQuery } },
    { ice: { contains: searchQuery } },
  ];

  // Fetch filtered commandes with pagination and related data
  const [fournisseurs, totalFournisseurs] = await Promise.all([
    prisma.fournisseurs.findMany({
      where: filters,
      skip: (page - 1) * fournisseursPerPage,
      take: fournisseursPerPage,
      orderBy: { createdAt: "desc" },
    }),
    prisma.fournisseurs.count({ where: filters }), // Get total count for pagination
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalFournisseurs / fournisseursPerPage);

  // Return the response
  return NextResponse.json({
    fournisseurs,
    totalPages,
  });
}