import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";
export async function POST(req) {
  const response = await req.json();
  const { charge } = response;
  try {
    const result = await prisma.charges.create({ data: { charge } });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error creating charge", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

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

export async function DELETE(req) {
  const response = await req.json();
  const { id } = response;
  try {
    const result = await prisma.charges.delete({ where: { id } });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error deleting charge", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
