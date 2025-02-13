import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
    const { nom, cin, rib, role, telephone, adresse, salaire } = response;
    const result = await prisma.employes.create({
      data: { nom, cin, rib, role, telephone, adresse, salaire },
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);
  }
}

export async function PUT(req) {
  try {
    const response = await req.json();
    const { id, nom, cin, rib, role, telephone, adresse, salaire } = response;
    const result = await prisma.employes.update({
      where: { id },
      data: {
        nom,
        cin,
        rib,
        role,
        telephone,
        adresse,
        salaire,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);
  }
}

export async function GET() {
  const employes = await prisma.employes.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });
  return NextResponse.json({ employes });
}
