import { NextResponse } from "next/server";
import { authErrorResponse, requireAdmin, requireAuth } from "@/lib/auth-utils";
import prisma from "../../../../lib/prisma";

export async function GET(_, { params }) {
  try {
    await requireAuth();

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }
    const fournisseur = await prisma.fournisseurs.findUnique({
      where: { id },
    });
    if (!fournisseur) {
      return NextResponse.json({ error: "Fournisseur non trouvé" }, { status: 404 });
    }
    return NextResponse.json(fournisseur);
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(_, { params }) {
  try {
    await requireAdmin();

    const id = params.id;

    const fournisseur = await prisma.fournisseurs.delete({
      where: { id },
    });
    return NextResponse.json(fournisseur);
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}


