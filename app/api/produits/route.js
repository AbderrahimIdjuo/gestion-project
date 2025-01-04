import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const { designation, categorie, prixAchat, prixVente, statu, stock } =
      resopns;
    const result = await prisma.produits.create({
      data: {
        designation,
        categorie,
        prixAchat: parseFloat(prixAchat),
        prixVente: parseFloat(prixVente),
        statut: statu,
        stock: parseInt(stock, 10),
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

export async function PUT(req) {
  try {
    const resopns = await req.json();
    const { id, designation, categorie, prixAchat, prixVente, statu, stock } =
      resopns;

    const result = await prisma.produits.update({
      where: { id },
      data: {
        designation,
        categorie,
        prixAchat: parseFloat(prixAchat),
        prixVente: parseFloat(prixVente),
        statut: statu,
        stock: parseInt(stock, 10),
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
  });
  return NextResponse.json({ produits });
}
