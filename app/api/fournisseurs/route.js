import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const { nom, email, telephone, adresse, ice, telephoneSecondaire , dette } =
      resopns;
    const result = await prisma.fournisseurs.create({
      data: {
        nom,
        email,
        telephone,
        adresse,
        ice,
        telephoneSecondaire,
        dette : parseFloat(dette) || 0,
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
    const {
      id,
      nom,
      email,
      telephone,
      adresse,
      ice,
      telephoneSecondaire,
      dette,
    } = resopns;
    const result = await prisma.fournisseurs.update({
      where: { id },
      data: {
        nom,
        email,
        telephone,
        adresse,
        ice,
        telephoneSecondaire,
        dette: parseFloat(dette) || 0 ,
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

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("query") || "";
  const limitParam = searchParams.get("limit");

  const filters = {};

  // Si limit est fourni (ex: rapport qui a besoin de tous les fournisseurs avec dette), l'utiliser
  const fournisseursPerPage =
    limitParam != null
      ? Math.min(parseInt(limitParam, 10) || 10, 10000)
      : 10;

  // Search filter by numero and client name
  filters.OR = [
    { nom: { contains: searchQuery, mode: "insensitive" } },
    { adresse: { contains: searchQuery, mode: "insensitive" } },
    { telephone: { contains: searchQuery } },
    { email: { contains: searchQuery, mode: "insensitive" } },
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
