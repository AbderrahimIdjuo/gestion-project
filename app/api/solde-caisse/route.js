import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function PUT(req) {
  try {
    const resopns = await req.json();
    const { solde } = resopns;
    console.log("solde type", typeof solde);

    const result = await prisma.comptabilite.update({
      where: { id: 1 },
      data: {
        caisse: parseFloat(solde),
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
