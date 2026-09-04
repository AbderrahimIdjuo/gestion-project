import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const produits = await prisma.produits.findMany({
      select: {
        id: true,
        designation: true,
        reference: true,
        categorieId: true,
        Unite: true,
      },
      orderBy: { designation: "asc" },
    });

    return NextResponse.json({ produits });
  } catch (error) {
    console.error("GET /api/produits/liste:", error);
    return NextResponse.json(
      { message: "Erreur lors du chargement des produits." },
      { status: 500 }
    );
  }
}
