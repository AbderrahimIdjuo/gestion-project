import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const employes = await prisma.employes.findMany({
      where: { role: "manager" },
    });
    return NextResponse.json({ employes });
  } catch (error) {
    console.error("Error fetching employes:", error);
    return NextResponse.json(
      { error: "Failed to fetch employes" },
      { status: 500 }
    );
  }
}
