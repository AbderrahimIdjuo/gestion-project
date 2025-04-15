import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || null;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const searchQuery = searchParams.get("query");
    const filters = {};

    if (searchQuery) {
      filters.nom = {
        contains: searchQuery,
      };
    }
 
    const fournisseurs = await prisma.fournisseurs.findMany({
      where: filters,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const lastFournisseur = fournisseurs[fournisseurs.length - 1];
    const nextCursor = lastFournisseur ? lastFournisseur.id : null;

    return NextResponse.json({ fournisseurs, nextCursor });
  } catch (error) {
    console.error("Error fetching fournisseurs:", error);
    return NextResponse.json(
      { error: "Failed to fetch fournisseurs" },
      { status: 500 }
    );
  }
}
