import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  const lastCommande = await prisma.commandeFourniture.findFirst({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(lastCommande);
}
