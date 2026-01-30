import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function DELETE(_, { params }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error?.message?.includes("Access denied")) {
      return NextResponse.json(
        { error: "Accès refusé. Rôle admin requis." },
        { status: 403 }
      );
    }
    if (error?.message?.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    throw error;
  }
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
          type: "depense",
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
