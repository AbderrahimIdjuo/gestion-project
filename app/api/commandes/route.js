import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const {
      numero,
      clientId,
      produits,
      statut,
      sousTotal,
      fraisLivraison,
      reduction,
      total,
      typeReduction,
      note,
      avance,
      echeance
    } = resopns;
    const result = await prisma.commandes.create({
      data: {
        numero,
        clientId,
        statut,
        sousTotal: sousTotal,
        fraisLivraison: parseFloat(fraisLivraison),
        reduction: parseInt(reduction),
        total: total,
        typeReduction,
        note,
        echeance,
        avance,
        commandeProduits: {
          create: produits.map((produit) => ({
            designation: produit.details || "Unknown Product",
            quantite: parseInt(produit.quantity, 10) || 0,
            prixUnite: parseFloat(produit.rate) || 0,
            montant: parseFloat(produit.quantity * produit.rate) || 0,
          })),
        },
      },
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);

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
        sousTotal: sousTotal,
        fraisLivraison: fraisLivraison,
        reduction: reduction,
        total: total,
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
  const commandes = await prisma.commandes.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      client: true,
    },
  });
  return NextResponse.json({ commandes });
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
