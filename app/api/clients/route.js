import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const { nom, email, telephone, adresse } = resopns;
    const result = await prisma.clients.create({
      data: {
        nom,
        email,
        telephone,
        adresse,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT") {
      return NextResponse.json(
        {
          message:
            "Duplicate field error: A record with this value already exists.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const resopns = await req.json();
    const { id, nom, email, telephone, adresse } = resopns;
    const result = await prisma.clients.update({
      where: { id },
      data: {
        nom,
        email,
        telephone,
        adresse,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          message:
            "Duplicate field error: A record with this value already exists.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const Clients = await prisma.clients.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });
  return NextResponse.json({ Clients });
}
