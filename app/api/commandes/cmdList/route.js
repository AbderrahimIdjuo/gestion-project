import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = "force-dynamic";
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || null;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const searchQuery = searchParams.get("query");
    const filters = {};

    if (searchQuery) {
      // filters.numero = {
      //   contains: searchQuery,
      //   mode: "insensitive",
      // };
      filters.OR = [
        { numero: { contains: searchQuery, mode: "insensitive" } },
        { client: { nom: { contains: searchQuery, mode: "insensitive" } } },
      ];
    }
    const commandes = await prisma.commandes.findMany({
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

    const lastFournisseur = commandes[commandes.length - 1];
    const nextCursor = lastFournisseur ? lastFournisseur.id : null;

    return NextResponse.json({ commandes, nextCursor });
  } catch (error) {
    console.error("Error fetching commandes:", error);
    return NextResponse.json(
      { error: "Failed to fetch commandes" },
      { status: 500 }
    );
  }
}
