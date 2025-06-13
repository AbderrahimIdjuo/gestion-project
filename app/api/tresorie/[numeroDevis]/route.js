import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(_, { params }) {
  const numeroDevis = params.numeroDevis;
  const transactions = await prisma.transactions.findMany({
    where: { reference : numeroDevis },
  });
  return NextResponse.json({ transactions });
}
