import { NextResponse } from "next/server";
import { authErrorResponse, requireAdmin } from "@/lib/auth-utils";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function PUT(req) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { id, solde } = body;
    const parsedSolde =
      typeof solde === "number" ? solde : parseFloat(solde);

    if (!id || Number.isNaN(parsedSolde)) {
      return NextResponse.json(
        { message: "Identifiant ou solde invalide." },
        { status: 400 }
      );
    }

    const result = await prisma.comptesBancaires.update({
      where: { id },
      data: {
        solde: parsedSolde,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;

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
