import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  const infoEntreprise = await prisma.infoEntreprise.findMany();
  console.log("infoEntreprise : " , infoEntreprise[0]);
  
  return NextResponse.json({ infoEntreprise : infoEntreprise[0] });
}
