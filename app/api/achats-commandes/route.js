import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
    const { produit, payer, fournisseur, quantite, prixUnite, description } =
      response;
    const result = await prisma.achatsCommandes.create({
      data: {
        produitId: produit.id,
        quantite: parseInt(quantite, 10),
        prixUnite: parseFloat(prixUnite),
        payer,
        description,
        statut: "En cours",
      },
    });
    // Mise à jour du produit
    if (fournisseur) {
      await prisma.produits.update({
        where: { id: produit.id },
        data: {
          fournisseurId: fournisseur.id,
        },
      });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const response = await req.json();
    const {
      id,
      designation,
      categorie,
      prixAchat,
      prixVente,
      statu,
      stock,
      description,
    } = response;

    const result = await prisma.produits.update({
      where: { id },
      data: {
        designation,
        categorie,
        prixAchat: parseFloat(prixAchat),
        prixVente: parseFloat(prixVente),
        statut: statu,
        stock: parseInt(stock, 10),
        description,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const commandes = await prisma.achatsCommandes.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      produit: {
        include: {
          fournisseur: {
            select: {
              nom: true, 
            },
          },
        },
      },
      commandeClient : {
        select: {
          numero: true, 
        },
      },
    },
  });
  return NextResponse.json({ commandes });
}
