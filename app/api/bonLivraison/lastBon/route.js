import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET() {
  const lastBon = await prisma.bonLivraison.findFirst({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(lastBon);
}
