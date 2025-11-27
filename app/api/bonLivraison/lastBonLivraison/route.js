import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET() {

  const lastBonLivraison = await prisma.bonLivraison.findFirst({
    orderBy: { createdAt: "desc" },
  });

  // Return the response
  return NextResponse.json({
    lastBonLivraison,
  });
}
