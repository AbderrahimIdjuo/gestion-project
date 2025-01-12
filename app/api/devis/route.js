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
      typeReduction,
      note,
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
        typeReduction,
        note,
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
    const {
      id,
      numero,
      clientId,
      articls,
      statut,
      sousTotal,
      fraisLivraison,
      reduction,
      total,
      typeReduction,
      note,
    } = resopns;

    const existingArticls = articls.filter(
      (articl) => typeof articl.id === "string"
    );
    const newArticls = articls.filter(
      (articl) => typeof articl.id === "number"
    );
    console.log("existingArticls", existingArticls);
    console.log("newArticls", newArticls);

    const result = await prisma.devis.update({
      where: { id },
      data: {
        numero,
        clientId,
        statut,
        sousTotal: parseFloat(sousTotal),
        fraisLivraison: parseFloat(fraisLivraison),
        reduction: parseInt(reduction),
        total: parseFloat(total),
        typeReduction,
        note,
        articls: {
          update: existingArticls.map((articl) => ({
            where: { id: articl.id },
            data: {
              designation: articl.designation,
              quantite: parseInt(articl.quantite),
              prixUnite: parseFloat(articl.prixUnite),
              montant: articl.quantite * articl.prixUnite,
            },
          })),
          create: newArticls.map((articl) => ({
            designation: articl.designation,
            quantite: parseInt(articl.quantite),
            prixUnite: parseFloat(articl.prixUnite),
            montant: articl.quantite * articl.prixUnite,
          })),
        },
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


export async function DELETE(req) {
  try {
    // Parse the JSON body
    const { ids } = await req.json();

    // Validate the input
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid or missing IDs" }, { status: 400 });
    }

    // Perform the deletion
    const result = await prisma.articls.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    // Return success response
    return NextResponse.json({ message: `${result.count} records deleted.` });
  } catch (error) {
    console.error("Error deleting records:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

