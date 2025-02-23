import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  const modesPaiement = await prisma.modesPaiement.findMany();
  return NextResponse.json({ modesPaiement });
}

