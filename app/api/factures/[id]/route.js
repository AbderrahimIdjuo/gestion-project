import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function DELETE(_, { params }) {
  const id = params.id;

  const facture = await prisma.factures.delete({
    where: { id },
  });
  return NextResponse.json(facture);
}

export async function PUT(req, { params }) {
  const response = await req.json();
  const { numero, lable, montant, compte } = response;
  const id = params.id;

  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      await tx.factures.update({
        where: { id },
        data: {
          payer: true,
          dateReglement: new Date(),
        },
      });
      await tx.transactions.create({
        data: {
          reference: numero,
          type: "dépense",
          montant: montant,
          compte,
          lable,
        },
      });
    });

    return NextResponse.json({ transactionResult });
  } catch (error) {
    console.log(error);
  }
}
