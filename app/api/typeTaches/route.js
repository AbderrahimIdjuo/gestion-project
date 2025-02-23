import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  const taches = await prisma.tachesEmployes.findMany();
  return NextResponse.json({ taches });
}
