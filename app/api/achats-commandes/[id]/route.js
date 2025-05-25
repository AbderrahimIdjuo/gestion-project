import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function DELETE(_, { params }) {
  const id = params.id;
  console.log("id : ", id);

  const client = await prisma.commandeFourniture.delete({
    where: { id },
  });
  return NextResponse.json(client);
}
