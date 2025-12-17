import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

interface ReglementWithFournisseur {
  id: string;
  montant: number;
  datePrelevement: Date | null;
  fournisseur: {
    id: string;
    nom: string;
  };
}

interface TodayPrelevementsResponse {
  todayReglements: ReglementWithFournisseur[];
  overdueReglements: ReglementWithFournisseur[];
  count: number;
}

export async function GET(): Promise<NextResponse<TodayPrelevementsResponse | { error: string }>> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Règlements d'aujourd'hui (datePrelevement = aujourd'hui ET statusPrelevement = "en_attente")
    const todayReglements = await prisma.reglement.findMany({
      where: {
        datePrelevement: {
          gte: today,
          lt: tomorrow,
        },
        statusPrelevement: "en_attente",
      },
      select: {
        id: true,
        montant: true,
        datePrelevement: true,
        fournisseur: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: {
        datePrelevement: "asc",
      },
    });

    // Règlements en retard (datePrelevement < aujourd'hui ET statusPrelevement = "en_attente")
    const overdueReglements = await prisma.reglement.findMany({
      where: {
        datePrelevement: {
          lt: today,
        },
        statusPrelevement: "en_attente",
      },
      select: {
        id: true,
        montant: true,
        datePrelevement: true,
        fournisseur: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: {
        datePrelevement: "asc",
      },
    });

    const count = todayReglements.length + overdueReglements.length;

    return NextResponse.json({
      todayReglements,
      overdueReglements,
      count,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des prélèvements:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des prélèvements" },
      { status: 500 }
    );
  }
}

