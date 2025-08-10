import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET() {
  // Fetch the liste of devis withe dette > 0
  const devis = await prisma.devis.findMany({
    where: {
      statutPaiement: { in: ["impaye", "enPartie"] },
    },
    include: {
      client: true,
    },
  });

  return NextResponse.json({
    devis,
  });
}
