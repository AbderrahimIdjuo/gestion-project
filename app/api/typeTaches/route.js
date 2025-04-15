import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const tachesPerPage = 100;
  const filters = {};
  // Fetch filtered commandes with pagination and related data
  const [taches, totaltaches] = await Promise.all([
    prisma.tachesEmployes.findMany({
      where: filters,
      skip: (page - 1) * tachesPerPage,
      take: tachesPerPage,
    }),
    prisma.tachesEmployes.count({ where: filters }), // Get total count for pagination
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totaltaches / tachesPerPage);

  // Return the response
  return NextResponse.json({
    taches,
    totalPages,
  });
}
