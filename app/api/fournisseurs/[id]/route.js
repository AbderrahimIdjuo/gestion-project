import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { authErrorResponse, requireAuth } from "@/lib/auth-utils";

export async function GET(_, { params }) {
  try {
    // BUG-002 audit: reading a fournisseur by id had no handler auth
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
    console.log(error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(_, { params }) {
  try {
    // BUG-002 audit: deleting fournisseurs had no handler auth
    await requireAuth();
    const id = params.id;

    const fournisseur = await prisma.fournisseurs.delete({
      where: { id },
    });
    return NextResponse.json(fournisseur);
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.log(error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
