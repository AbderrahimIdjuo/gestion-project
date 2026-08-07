import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { authErrorResponse, requireAuth } from "@/lib/auth-utils";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    // BUG-002 audit: infinite-scroll fournisseur list had no handler auth
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || null;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const searchQuery = searchParams.get("query");
    const filters = {};

    if (searchQuery) {
      filters.nom = {
        contains: searchQuery,
        mode: "insensitive",
      };
    }
    const fournisseurs = await prisma.fournisseurs.findMany({
      where: filters,
      orderBy: { id: "asc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const lastFournisseur = fournisseurs[fournisseurs.length - 1];
    const nextCursor = lastFournisseur ? lastFournisseur.id : null;

    return NextResponse.json({ fournisseurs, nextCursor });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error fetching fournisseurs:", error);
    return NextResponse.json(
      { error: "Failed to fetch fournisseurs" },
      { status: 500 }
    );
  }
}
