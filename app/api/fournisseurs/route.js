import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const { nom, email, telephone, adresse, ice, telephoneSecondaire } =
      resopns;
    const result = await prisma.fournisseurs.create({
      data: {
        nom,
        email,
        telephone,
        adresse,
        ice,
        telephoneSecondaire,
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
    const { id, nom, email, telephone, adresse, ice, telephoneSecondaire } =
      resopns;
    const result = await prisma.fournisseurs.update({
      where: { id },
      data: {
        nom,
        email,
        telephone,
        adresse,
        ice,
        telephoneSecondaire,
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
  const Fournisseurs = await prisma.fournisseurs.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });
  return NextResponse.json({ Fournisseurs });
}
