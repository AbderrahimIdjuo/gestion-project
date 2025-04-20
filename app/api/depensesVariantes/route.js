"use server";
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
    const { label, montant, description, compte, numero } = response;
    const transactionResult = await prisma.$transaction(async (tx) => {
      const factureRecurrente = await tx.depensesVariantes.create({
        data: {
          label,
          montant: montant || 0,
          description,
          compte,
          numero,
        },
      });
      // créer une transaction
      await tx.transactions.create({
        data: {
          reference: numero,
          type: "dépense",
          montant,
          compte,
          lable: label,
        },
      });
      return factureRecurrente;
    });
    return NextResponse.json({
      message: "facture variante créée avec succès.",
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
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const numero = searchParams.get("numero");
  const transactionDeleted = await prisma.transactions.findFirst({
    where: { reference: numero }
  });
  try {
    const response = await req.json();
    const { id, label, compte, montant, description } = response;
    const result = await prisma.$transaction(async (prisma) => {
      await prisma.depensesVariantes.update({
        where: { id },
        data: {
          label,
          montant,
          compte,
          description,
        },
      });

      await prisma.transactions.update({
        where: { id : transactionDeleted.id },
        data: {
          reference: numero,
          montant,
          compte,
          lable: label,
        },
      });
    })
    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("query") || "";

  //const filters = {};

  const facturesPerPage = 10;

  // Search filter by label or description
  const filters = {
    OR: [
      {
        label: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
    ],
  };

  // Fetch filtered commandes with pagination and related data
  const [factures, totalFactures] = await Promise.all([
    prisma.depensesVariantes.findMany({
      where: filters,
      skip: (page - 1) * facturesPerPage,
      take: facturesPerPage,
      orderBy: { createdAt: "desc" },
    }),
    prisma.depensesVariantes.count({ where: filters }), // Get total count for pagination
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalFactures / facturesPerPage);

  // Return the response
  return NextResponse.json({
    factures,
    totalPages,
  });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const numero = searchParams.get("numero");

  const transactionDeleted = await prisma.transactions.findFirst({
    where: { reference: numero }
  });
  const result = await prisma.$transaction(async (prisma) => {
    await prisma.depensesVariantes.delete({
      where: { id },
    });

    if (transactionDeleted) {
      await prisma.transactions.delete({
        where: { id: transactionDeleted.id }
      });
    }
  });

  return NextResponse.json({result});
}
