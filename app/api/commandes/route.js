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
      echeance,
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
            designation: produit.designation || "Unknown Product",
            quantite: parseInt(produit.quantite, 10) || 0,
            prixUnite: parseFloat(produit.prixUnite) || 0,
            montant: parseFloat(produit.quantite * produit.prixUnite) || 0,
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
      produits,
      statut,
      sousTotal,
      fraisLivraison,
      reduction,
      total,
      typeReduction,
      note,
      avance,
      echeance,
    } = resopns;

    const existingIds = produits.map((produit) => produit.id);
    console.log("existingIds", existingIds);

    // Step 1: Delete products not in the new produits array
    await prisma.commandesProduits.deleteMany({
      where: {
        commandeId: id, // Ensure this matches your schema for linking `commandeProduits` to `commandes`
        id: {
          notIn: existingIds, // Delete records not in the incoming produits array
        },
      },
    });

    const result = await prisma.commandes.update({
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
        avance,
        echeance,
        note,
        commandeProduits: {
          upsert: produits.map((articl) => ({
            where: { id: articl.id }, // Default to 0 or another placeholder for new products
            update: {
              designation: articl.designation,
              quantite: parseInt(articl.quantite),
              prixUnite: parseFloat(articl.prixUnite),
              montant: articl.quantite * articl.prixUnite,
            },
            create: {
              designation: articl.designation,
              quantite: parseInt(articl.quantite),
              prixUnite: parseFloat(articl.prixUnite),
              montant: articl.quantite * articl.prixUnite,
            },
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
