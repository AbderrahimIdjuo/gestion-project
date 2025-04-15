import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

// export async function GET() {
//   const infoEntreprise = await prisma.infoEntreprise.findMany();
//   console.log("infoEntreprise : ", infoEntreprise[0]);

//   return NextResponse.json({ infoEntreprise: infoEntreprise[0] });
// }



export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const infosPerPage = 10;
  const filters = {};
  // Fetch filtered commandes with pagination and related data
  const [infoEntreprise, totalCategories] = await Promise.all([
    prisma.infoEntreprise.findMany({
      where: filters,
      skip: (page - 1) * infosPerPage,
      take: infosPerPage,
    }),
    prisma.infoEntreprise.count({ where: filters }), // Get total count for pagination
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalCategories / infosPerPage);

  // Return the response
  return NextResponse.json({
    infoEntreprise: infoEntreprise[0] ,
    totalPages,
  });
}
