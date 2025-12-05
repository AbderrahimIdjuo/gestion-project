import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = "force-dynamic";
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || null;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const searchQuery = searchParams.get("query");
    const filters = {
      statut: {
        not: "Terminer",
      },
    };

    if (searchQuery) {
      filters.OR = [
        { numero: { contains: searchQuery, mode: "insensitive" } },
        { client: { nom: { contains: searchQuery, mode: "insensitive" } } },
      ];
    }
    const devis = await prisma.devis.findMany({
      where: filters,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        client: {
          select: {
            nom: true,
          },
        },
      },
    });

    const lastFournisseur = devis[devis.length - 1];
    const nextCursor = lastFournisseur ? lastFournisseur.id : null;

    return NextResponse.json({ devis, nextCursor });
  } catch (error) {
    console.error("Error fetching devis:", error);
    return NextResponse.json(
      { error: "Failed to fetch devis" },
      { status: 500 }
    );
  }
}
