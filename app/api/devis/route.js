import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const {
      numero,
      clientId,
      articls,
      statut,
      sousTotal,
      fraisLivraison,
      reduction,
      total,
    } = resopns;
    const result = await prisma.devis.create({
      data: {
        numero,
        clientId,
        statut,
        sousTotal: parseFloat(sousTotal),
        fraisLivraison: parseFloat(fraisLivraison),
        reduction: parseInt(reduction),
        total: parseFloat(total),
        articls: {
          create: articls.map((articl) => ({
            designation: articl.details,
            quantite: parseInt(articl.quantity),
            prixUnite: parseFloat(articl.rate),
            montant: articl.quantity * articl.rate,
          })),
        },
      },
    });
    return NextResponse.json({ result });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT") {
      return NextResponse.json(
        {
          message:
            "Duplicate field error: A record with this value already exists.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const resopns = await req.json();
    const { id, nom, email, telephone, adresse } = resopns;
    const result = await prisma.devis.update({
      where: { id },
      data: {
        nom,
        email,
        telephone,
        adresse,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          message:
            "Duplicate field error: A record with this value already exists.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const devis = await prisma.devis.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      client: true,
    },
  });
  return NextResponse.json({ devis });
}
