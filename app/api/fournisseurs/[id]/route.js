import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(_, { params }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }
  const fournisseur = await prisma.fournisseurs.findUnique({
    where: { id },
  });
  if (!fournisseur) {
    return NextResponse.json({ error: "Fournisseur non trouvé" }, { status: 404 });
  }
  return NextResponse.json(fournisseur);
}

export async function DELETE(_, { params }) {
  const id = params.id;

  const fournisseur = await prisma.fournisseurs.delete({
    where: { id },
  });
  return NextResponse.json(fournisseur);
}


