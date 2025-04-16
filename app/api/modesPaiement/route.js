import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const modesPaiementPerPage = 100;
const filters={}
  // Fetch filtered commandes with pagination and related data
  const [modesPaiement, totalmodesPaiement] = await Promise.all([
    prisma.modesPaiement.findMany({
      where : filters,
      skip: (page - 1) * modesPaiementPerPage,
      take: modesPaiementPerPage,
    }),
    prisma.modesPaiement.count({ where: filters }), // Get total count for pagination
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalmodesPaiement / modesPaiementPerPage);

  // Return the response
  return NextResponse.json({
    modesPaiement,
    totalPages,
  });
}