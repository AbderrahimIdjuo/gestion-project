import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET() {
  const lastCommande = await prisma.commandeFourniture.findFirst({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(lastCommande);
}
