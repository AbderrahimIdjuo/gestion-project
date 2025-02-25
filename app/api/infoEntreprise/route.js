import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  const infoEntreprise = await prisma.infoEntreprise.findMany();
  return NextResponse.json({ infoEntreprise });
}
