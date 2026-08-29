import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { isStockError, transferStock } from "@/lib/stock";

export const dynamic = "force-dynamic";

/**
 * POST { produitId, entrepotSourceId, entrepotDestId, quantite }
 *  or { entrepotSourceId, entrepotDestId, items: [{ produitId, quantite }, ...] }
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { produitId, entrepotSourceId, entrepotDestId, quantite, items } =
      body || {};

    const rows =
      Array.isArray(items) && items.length > 0
        ? items
        : [{ produitId, quantite }];

    await prisma.$transaction(async tx => {
      for (const row of rows) {
        await transferStock(tx, {
          produitId: row.produitId ?? row.id,
          entrepotSourceId,
          entrepotDestId,
          quantite: row.quantite,
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/produits/transfert:", error);
    if (isStockError(error)) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status || 400 }
      );
    }
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
