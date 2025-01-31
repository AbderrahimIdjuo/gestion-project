import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const { fournisseur , designation, categorie, prixAchat, prixVente, stock , description } =
      resopns;
    const result = await prisma.produits.create({
      data: {
        fournisseurId : fournisseur?.id || null ,
        designation,
        categorie,
        prixAchat,
        prixVente,
        stock,
        description
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const resopns = await req.json();
    const {id,  fournisseur , designation, categorie, prixAchat, prixVente, statut, stock , description } =
      resopns;

    const result = await prisma.produits.update({
      where: { id },
      data: {
        fournisseurId : fournisseur.id,
        designation,
        categorie,
        prixAchat: parseFloat(prixAchat),
        prixVente: parseFloat(prixVente),
        statut,
        stock: parseInt(stock, 10),
        description
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
  const produits = await prisma.produits.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include:{
      fournisseur : true
    }
  });
  return NextResponse.json({ produits });
}
