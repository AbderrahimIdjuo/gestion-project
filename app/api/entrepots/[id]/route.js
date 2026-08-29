import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(_req, { params }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { message: "Identifiant requis." },
        { status: 400 }
      );
    }

    const stockRestant = await prisma.produitEntrepot.aggregate({
      where: { entrepotId: id, quantite: { gt: 0 } },
      _sum: { quantite: true },
    });
    if ((stockRestant._sum.quantite ?? 0) > 0) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer cet entrepôt : il contient encore du stock. Transférez-le d'abord.",
        },
        { status: 409 }
      );
    }

    const transferts = await prisma.transfertsStock.count({
      where: {
        OR: [{ entrepotSourceId: id }, { entrepotDestId: id }],
      },
    });
    if (transferts > 0) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer cet entrepôt : des transferts y sont liés.",
        },
        { status: 409 }
      );
    }

    await prisma.produitEntrepot.deleteMany({ where: { entrepotId: id } });
    const result = await prisma.entrepots.delete({ where: { id } });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("DELETE /api/entrepots/[id]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression de l'entrepôt." },
      { status: 500 }
    );
  }
}
