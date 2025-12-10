import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prisma: PrismaClient = require("../../../../../lib/prisma").default;

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, newDate } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID du règlement est requis" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["confirme", "echoue", "reporte", "refuse"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error:
            "Statut invalide. Doit être: confirme, echoue, reporte, ou refuse",
        },
        { status: 400 }
      );
    }

    // If status is "reporte", newDate is required
    if (status === "reporte" && !newDate) {
      return NextResponse.json(
        { error: "Une nouvelle date est requise pour un prélèvement reporté" },
        { status: 400 }
      );
    }

    // Check if règlement exists
    const reglement = await prisma.reglement.findUnique({
      where: { id },
    });

    if (!reglement) {
      return NextResponse.json(
        { error: "Règlement non trouvé" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      statusPrelevement: string;
      datePrelevement?: Date;
    } = {
      statusPrelevement: status,
    };

    // If reporté, update the datePrelevement
    if (status === "reporte" && newDate) {
      updateData.datePrelevement = new Date(newDate);
    }

    // Update the règlement
    const updatedReglement = await prisma.reglement.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      reglement: updatedReglement,
      message: "Statut de prélèvement mis à jour avec succès",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du statut de prélèvement:",
      error
    );
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour du statut de prélèvement",
      },
      { status: 500 }
    );
  }
}
