import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function DELETE(_, { params }) {
  const id = params.id;

  const devi = await prisma.devis.delete({
    where: { id },
  });
  return NextResponse.json(devi);
}

export async function GET(_, { params }) {
  const id = params.id;
  const devi = await prisma.devis.findUnique({
    where: { id },
    include: {
      client: true,
      articls: true,
    },
  });
  return NextResponse.json({ devi });
}
