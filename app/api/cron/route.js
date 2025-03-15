import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    // Obtenir le jour actuel du mois (ex: 26 si on est le 26 février)
    const todayDay = new Date().getDate();

    // Mettre à jour uniquement les factures payées dont la date d'émission est aujourd'hui
    const updated = await prisma.factures.updateMany({
      where: {
        payer: true,
        dateEmission: todayDay, // Seules les factures avec ce jour précis seront modifiées
      },
      data: { payer: false },
    });

    console.log(
      `✅ ${updated.count} factures mises à jour en impayées pour le jour ${todayDay}`
    );
    return NextResponse.json({ message: "Ok." }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des factures :", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
