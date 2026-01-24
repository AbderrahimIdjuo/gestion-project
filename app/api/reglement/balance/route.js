import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const fromPrelevement = searchParams.get("fromPrelevement");
    const toPrelevement = searchParams.get("toPrelevement");

    if (!fromPrelevement || !toPrelevement) {
      return NextResponse.json(
        { error: "Les dates de début et de fin sont requises" },
        { status: 400 }
      );
    }

    // Récupérer le solde du compte professionnel
    const compteProfessionnel = await prisma.comptesBancaires.findFirst({
      where: {
        compte: "compte professionnel",
      },
    });

    // Calculer la somme des montants des règlements avec datePrelevement dans la période
    const startDatePrelevement = new Date(fromPrelevement);
    startDatePrelevement.setHours(0, 0, 0, 0);

    const endDatePrelevement = new Date(toPrelevement);
    endDatePrelevement.setHours(23, 59, 59, 999);

    const reglements = await prisma.reglement.findMany({
      where: {
        datePrelevement: {
          gte: startDatePrelevement,
          lte: endDatePrelevement,
        },
        compte: "compte professionnel",
      },
      select: {
        montant: true,
      },
    });

    const sommeReglements = reglements.reduce(
      (acc, reglement) => acc + reglement.montant,
      0
    );

    const solde = compteProfessionnel?.solde || 0;
    const difference = solde - sommeReglements;

    return NextResponse.json({
      solde,
      sommeReglements,
      difference,
      nombreReglements: reglements.length,
    });
  } catch (error) {
    console.error("Erreur lors du calcul de la balance:", error);
    return NextResponse.json(
      { error: "Erreur lors du calcul de la balance" },
      { status: 500 }
    );
  }
}

