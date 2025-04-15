import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const categoriesPerPage = 10;
const filters={}
  // Fetch filtered commandes with pagination and related data
  const [categories, totalCategories] = await Promise.all([
    prisma.categoriesProduits.findMany({
      where : filters,
      skip: (page - 1) * categoriesPerPage,
      take: categoriesPerPage,
    }),
    prisma.categoriesProduits.count({ where: filters }), // Get total count for pagination
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalCategories / categoriesPerPage);

  // Return the response
  return NextResponse.json({
    categories,
    totalPages,
  });
}
