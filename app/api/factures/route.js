"use server";
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
    const {
      numero,
      lable,
      type,
      montant,
      description,
      payer,
      dateEmission,
      compte,
    } = response;
    const transactionResult = await prisma.$transaction(async (tx) => {
      const factureRecurrente = await tx.factures.create({
        data: {
          numero,
          lable,
          type,
          montant: montant || 0,
          description,
          payer,
          dateEmission,
        },
      });
      // Si une facture est payer créer une transaction
      if (payer) {
        await tx.transactions.create({
          data: {
            reference: numero,
            type: "dépense",
            montant,
            compte,
            lable,
          },
        });
      }
      return factureRecurrente;
    });
    return NextResponse.json({
      message: "facture recurrente créée avec succès.",
      transactionResult,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la création de la facture." },
      { status: 500 }
    );
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
