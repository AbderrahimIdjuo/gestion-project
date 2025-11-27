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
      filters.nom = {
        contains: searchQuery,
        mode: "insensitive",
      };
    }

    const employes = await prisma.employes.findMany({
      where: filters,
      orderBy: { id: "asc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const lastClient = employes[employes.length - 1];
    const nextCursor = lastClient ? lastClient.id : null;

    return NextResponse.json({ employes, nextCursor });
  } catch (error) {
    console.error("Error fetching employes:", error);
    return NextResponse.json(
      { error: "Failed to fetch employes" },
      { status: 500 }
    );
  }
}
