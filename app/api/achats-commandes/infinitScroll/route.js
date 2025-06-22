import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || null;
    const limit = parseInt(searchParams.get("limit")) || 15;
    const searchQuery = searchParams.get("query");
    const filters = {};

    if (searchQuery) {
      // filters.numero = {
      //   contains: searchQuery,
      //   mode: "insensitive",
      // };
      filters.OR = [
        { numero: { contains: searchQuery, mode: "insensitive" } },
        {
          fournisseur: { nom: { contains: searchQuery, mode: "insensitive" } },
        },
      ];
    }

    const commandes = await prisma.commandeFourniture.findMany({
      where: filters,
      orderBy: { id: "asc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        fournisseur: {
          select: {
            nom: true,
          },
        },
        groups: {
          include: {
            produits: {
              include: {
                produit: {
                  select: {
                    designation: true,
                    prixAchat: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const lastClient = commandes[commandes.length - 1];
    const nextCursor = lastClient ? lastClient.id : null;

    return NextResponse.json({ commandes, nextCursor });
  } catch (error) {
    console.error("Error fetching commandes:", error);
    return NextResponse.json(
      { error: "Failed to fetch commandes" },
      { status: 500 }
    );
  }
}
