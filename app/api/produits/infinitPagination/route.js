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
      filters.designation = {
        contains: searchQuery,
      };
    }
 
    const produits = await prisma.produits.findMany({
      where: filters,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const lastProduit = produits[produits.length - 1];
    const nextCursor = lastProduit ? lastProduit.id : null;

    return NextResponse.json({ produits, nextCursor });
  } catch (error) {
    console.error("Error fetching produits:", error);
    return NextResponse.json(
      { error: "Failed to fetch produits" },
      { status: 500 }
    );
  }
}
