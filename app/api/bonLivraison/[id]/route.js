import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function DELETE(request, { params }) {
  const id = params.id;

  const url = new URL(request.url);
  const fournisseurId = url.searchParams.get("fournisseurId");
  const type = url.searchParams.get("type");
  const bonLivraison = await prisma.bonLivraison.delete({
    where: { id },
  });

  // Mise à jour du fournisseur si le type est "achats"
  await prisma.fournisseurs.update({
    where: { id: fournisseurId },
    data: {
      dette:
        type === "achats"
          ? {
              decrement: bonLivraison.total,
            }
          : type === "retour"
          ? {
              increment: bonLivraison.total,
            }
          : undefined,
    },
  });

  return NextResponse.json(bonLivraison);
}
