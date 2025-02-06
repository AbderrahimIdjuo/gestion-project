import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { randomUUID } from "crypto";

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
        sousTotal,
        fraisLivraison,
        reduction,
        total,
        typeReduction,
        note,
        articls: {
          create: articls.map((articl) => ({
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
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de la commande." },
      { status: 500 }
    );
  }
}


export async function PUT(req) {
  try {
    const requestBody = await req.json();
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
    } = requestBody;

    // Fetch existing devis with articls
    const devi = await prisma.devis.findUnique({
      where: { id },
      include: { articls: true },
    });

    // If the devis is not found, return an error
    if (!devi) {
      return NextResponse.json({ message: "Devi not found" }, { status: 404 });
    }

    // Extract existing article IDs
    const existingIds = new Set(devi.articls.map((articl) => articl.id));
    const incomingIds = new Set(articls.map((articl) => articl.id));

    // Categorize articles
    const existingArticls = articls.filter((articl) => existingIds.has(articl.id));
    const newArticls = articls.filter((articl) => !existingIds.has(articl.id));
    const deletedArticls = devi.articls.filter((articl) => !incomingIds.has(articl.id));

    const result = await prisma.$transaction(async (tx) => {
      // Delete old articls only if necessary
      if (deletedArticls.length > 0) {
        await tx.articls.deleteMany({
          where: {
            id: { in: deletedArticls.map((p) => p.id) },
          },
        });
      }

      // Update devis and its articles
      return await tx.devis.update({
        where: { id },
        data: {
          numero,
          clientId,
          statut,
          sousTotal,
          fraisLivraison,
          reduction,
          total,
          typeReduction,
          note,
          articls: {
            update: existingArticls.map((articl) => ({
              where: { id: articl.id },
              data: {
                designation: articl.designation,
                quantite: articl.quantite,
                prixUnite: articl.prixUnite,
                montant: articl.quantite * articl.prixUnite,
              },
            })),
            create: newArticls.map((articl) => ({
              designation: articl.designation,
              quantite: articl.quantite,
              prixUnite: articl.prixUnite,
              montant: articl.quantite * articl.prixUnite,
            })),
          },
        },
      });
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error updating devis:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "Duplicate field error: A record with this value already exists." },
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
      return NextResponse.json(
        { error: "Invalid or missing IDs" },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
