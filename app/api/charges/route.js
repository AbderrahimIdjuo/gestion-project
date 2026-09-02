import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

const CHARGE_TYPES = ["fixe", "variante"];

function normalizeType(type) {
  return CHARGE_TYPES.includes(type) ? type : "fixe";
}

export async function POST(req) {
  const response = await req.json();
  const { charge, type } = response;
  try {
    const result = await prisma.charges.create({
      data: { charge, type: normalizeType(type) },
    });
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
  const type = searchParams.get("type");
  const chargesPerPage = 100;
  const filters = {};
  if (type && type !== "all" && CHARGE_TYPES.includes(type)) {
    filters.type = type;
  }
  const [charges, totalcharges] = await Promise.all([
    prisma.charges.findMany({
      where: filters,
      skip: (page - 1) * chargesPerPage,
      take: chargesPerPage,
    }),
    prisma.charges.count({ where: filters }),
  ]);

  const totalPages = Math.ceil(totalcharges / chargesPerPage);

  return NextResponse.json({
    charges,
    totalPages,
  });
}

export async function PUT(req) {
  const response = await req.json();
  const { id, charge, type } = response;
  if (!id) {
    return NextResponse.json(
      { message: "L'identifiant de la charge est requis." },
      { status: 400 }
    );
  }
  try {
    const data = {};
    if (typeof charge === "string" && charge.trim() !== "") {
      data.charge = charge.trim();
    }
    if (type !== undefined) {
      data.type = normalizeType(type);
    }
    const result = await prisma.charges.update({ where: { id }, data });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error updating charge", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
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
