import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function DELETE(_, { params }) {
  const id = params.id;
  const devi = await prisma.devis.delete({
    where: { id },
  });
  console.log("from devis/id", devi);
  //supprimer les transactions liées aux devis
  await prisma.transactions.deleteMany({
    where: {
      reference: devi.numero,
    },
  });
  return NextResponse.json(devi);
}

export async function GET(_, { params }) {
  const id = params.id;
  const devi = await prisma.devis.findUnique({
    where: { id },
    include: {
      client: true,
      articls: true,
      commercant: true,
    },
  });
  return NextResponse.json({ devi });
}

export async function PATCH(req, { params }) {
  try {
    const id = params.id;
    const { statut } = await req.json();

    // Récupérer le devis actuel pour connaître son statut
    const currentDevi = await prisma.devis.findUnique({
      where: { id },
      select: { statut: true },
    });

    // Préparer les données à mettre à jour
    const updateData = { statut };

    // Si le statut est "Terminer", définir dateEnd à la date actuelle
    if (statut === "Terminer") {
      updateData.dateEnd = new Date();
    }
    // Si le statut actuel est "Terminer" et le nouveau statut n'est pas "Terminer", réinitialiser dateEnd à null
    else if (currentDevi?.statut === "Terminer" && statut !== "Terminer") {
      updateData.dateEnd = null;
    }

    const devi = await prisma.devis.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ devi });
  } catch (error) {
    console.error("Error updating devis statut:", error);
    return NextResponse.json(
      { error: "Failed to update devis statut" },
      { status: 500 }
    );
  }
}
