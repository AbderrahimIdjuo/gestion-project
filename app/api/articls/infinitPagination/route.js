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
        contains: searchQuery, mode: "insensitive" 
      };
    }
 
    const articls = await prisma.items.findMany({
      where: filters,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const lastArticl = articls[articls.length - 1];
    const nextCursor = lastArticl ? lastArticl.id : null;

    return NextResponse.json({ articls, nextCursor });
  } catch (error) {
    console.error("Error fetching articls:", error);
    return NextResponse.json(
      { error: "Failed to fetch articls" },
      { status: 500 }
    );
  }
}
