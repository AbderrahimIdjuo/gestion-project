import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
    const { nom, cin, rib, role, telephone, adresse, salaire } = response;
    const result = await prisma.employes.create({
      data: { nom, cin, rib, role, telephone, adresse, salaire },
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);
  }
}

export async function PUT(req) {
  try {
    const response = await req.json();
    const { id, nom, cin, rib, role, telephone, adresse, salaire } = response;
    const result = await prisma.employes.update({
      where: { id },
      data: {
        nom,
        cin,
        rib,
        role,
        telephone,
        adresse,
        salaire,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);
  }
}


export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("query") || "";

  const filters = {};

  const employesPerPage = 10;

  // Search filter by numero and client name
  filters.OR = [
    { nom: { contains: searchQuery } },
    { adresse: { contains: searchQuery } },
    { telephone: { contains: searchQuery } },
    { cin: { contains: searchQuery } },
  ];

  // Fetch filtered commandes with pagination and related data
  const [employes, totalClients] = await Promise.all([
    prisma.employes.findMany({
      where: filters,
      skip: (page - 1) * employesPerPage,
      take: employesPerPage,
      orderBy: { createdAt: "desc" },
    }),
    prisma.employes.count({ where: filters }), // Get total count for pagination
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalClients / employesPerPage);

  // Return the response
  return NextResponse.json({
    employes,
    totalPages,
  });
}
