import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const comptesPerPage = 100;
const filters={}
  // Fetch filtered commandes with pagination and related data
  const [comptes, totalcomptes] = await Promise.all([
    prisma.comptesBancaires.findMany({
      where : filters,
      skip: (page - 1) * comptesPerPage,
      take: comptesPerPage,
    }),
    prisma.comptesBancaires.count({ where: filters }), // Get total count for pagination
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalcomptes / comptesPerPage);

  // Return the response
  return NextResponse.json({
    comptes,
    totalPages,
  });
}
