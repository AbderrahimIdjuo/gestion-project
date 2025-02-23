import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function DELETE(_, { params }) {
  const id = params.id;

  const facture = await prisma.factures.delete({
    where: { id },
  });
  return NextResponse.json(facture);
}

export async function PUT(_, { params }) {
  const id = params.id;
  try {
    const result = await prisma.factures.update({
      where: { id },
      data: {
        payer: true,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);
  }
}
