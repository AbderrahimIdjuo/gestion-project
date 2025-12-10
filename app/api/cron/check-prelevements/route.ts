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

export async function GET(req: Request) {
  try {
    // Verify cron secret (optional - set CRON_SECRET in environment variables)
    // For Vercel Cron, you can also use x-vercel-signature header verification
    if (process.env.CRON_SECRET) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get today's date at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow's date at 00:00:00 to use as upper bound
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all règlements where datePrelevement = today AND statusPrelevement = "en_attente"
    // Using type assertion to handle Prisma client type mismatch until Prisma client is regenerated
    const reglements = (await prisma.reglement.findMany({
      where: {
        datePrelevement: {
          gte: today,
          lt: tomorrow,
        },
        statusPrelevement: "en_attente",
      } as any,
      include: {
        fournisseur: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    })) as ReglementWithFournisseur[];

    // Log the results (in production, you might want to send notifications)
    console.log(
      `[CRON] Found ${reglements.length} prélèvements scheduled for today`
    );

    // Optionally, trigger revalidation of the reglements page
    // This would require Next.js revalidation API or ISR

    return NextResponse.json({
      success: true,
      message: `Found ${reglements.length} prélèvements scheduled for today`,
      count: reglements.length,
      reglements: reglements.map(r => ({
        id: r.id,
        fournisseur: r.fournisseur.nom,
        montant: r.montant,
        datePrelevement: r.datePrelevement,
      })),
    });
  } catch (error) {
    console.error(
      "Erreur lors de la vérification des prélèvements (CRON):",
      error
    );
    return NextResponse.json(
      {
        error: "Erreur lors de la vérification des prélèvements",
      },
      { status: 500 }
    );
  }
}
