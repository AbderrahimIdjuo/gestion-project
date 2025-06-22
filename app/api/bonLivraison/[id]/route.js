import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function DELETE(_, { params }) {
  const id = params.id;

  const bonLivraison = await prisma.bonLivraison.delete({
    where: { id },
  });
  return NextResponse.json(bonLivraison);
}
