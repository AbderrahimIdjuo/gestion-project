import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET() {
  const totalDevis = await prisma.devis.count();
  const lastDevis = await prisma.devis.findFirst({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(lastDevis);
}
