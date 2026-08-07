import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { authErrorResponse, requireAuth } from "@/lib/auth-utils";

export async function GET(req, { params }) {
  try {
    // BUG-002 audit: single-règlement GET had no handler-level auth
    await requireAuth();
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "ID du règlement est requis" },
        { status: 400 }
      );
    }

    const reglement = await prisma.reglement.findUnique({
      where: { id },
      include: {
        fournisseur: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
            adresse: true,
            ice: true,
          },
        },
        cheque: {
          select: {
            id: true,
            numero: true,
            dateReglement: true,
            datePrelevement: true,
          },
        },
        factureAchats: {
          select: {
            id: true,
            numero: true,
          },
        },
      },
    });

    if (!reglement) {
      return NextResponse.json(
        { error: "Règlement non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ reglement });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Erreur lors de la récupération du règlement:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du règlement" },
      { status: 500 }
    );
  }
}
