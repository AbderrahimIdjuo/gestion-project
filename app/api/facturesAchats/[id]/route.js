"use server";
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Vérifier si la facture existe
    const facture = await prisma.FacturesAchats.findUnique({
      where: { id },
      include: {
        reglements: true,
      },
    });

    if (!facture) {
      return NextResponse.json(
        { message: "Facture non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer la facture (les produits seront supprimés automatiquement grâce à onDelete: Cascade)
    // Si des règlements sont liés, on peut soit les supprimer, soit les délier
    // Ici, on supprime simplement la facture et les règlements garderont factureAchatsId = null
    await prisma.FacturesAchats.delete({
      where: { id },
    });

    // Mettre à jour les règlements pour retirer la référence à la facture
    if (facture.reglements.length > 0) {
      await prisma.reglement.updateMany({
        where: { factureAchatsId: id },
        data: { factureAchatsId: null },
      });
    }

    return NextResponse.json({
      message: "Facture supprimée avec succès",
    });
  } catch (error) {
    console.error("Error deleting facture:", error);
    return NextResponse.json(
      {
        message:
          "Une erreur est survenue lors de la suppression de la facture.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
