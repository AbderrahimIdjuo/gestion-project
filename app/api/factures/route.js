"use server";
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
    const { numero, lable, type, montant, description, payer, dateEmission } =
      response;
    const result = await prisma.factures.create({
      data: { numero, lable, type, montant : montant || 0 , description, payer, dateEmission },
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);
  }
}

export async function PUT(req) {
  try {
    const response = await req.json();
    const { id, numero, lable, type, montant, description, payer } = response;
    const result = await prisma.factures.update({
      where: { id },
      data: {
        numero,
        lable,
        type,
        montant,
        description,
        payer,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);
  }
}

export async function GET() {
  const factures = await prisma.factures.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });
  return NextResponse.json({ factures });
}
