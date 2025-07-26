import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const chargesPerPage = 100;
  const filters = {};
  // Fetch filtered commandes with pagination and related data
  const [charges, totalcharges] = await Promise.all([
    prisma.charges.findMany({
      where: filters,
      skip: (page - 1) * chargesPerPage,
      take: chargesPerPage,
    }),
    prisma.charges.count({ where: filters }), // Get total count for pagination
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalcharges / chargesPerPage);

  // Return the response
  return NextResponse.json({
    charges,
    totalPages,
  });
}
