import { NextResponse } from "next/server";
import { authErrorResponse, requireAdmin } from "@/lib/auth-utils";
import prisma from "../../../../lib/prisma";
import { applyStockDelta, isStockError } from "@/lib/stock";

export const dynamic = "force-dynamic";

/**
 * POST { entrepotId: string, items: [{ produitId: string, quantite: number }, ...] }
 * Augmente le stock de chaque produit dans l'entrepôt indiqué.
 */
export async function POST(req) {
  try {
    await requireAdmin();

    const body = await req.json();
    const items = body?.items;
    const entrepotId = body?.entrepotId;
    if (!entrepotId) {
      return NextResponse.json(
        { message: "Entrepôt requis." },
        { status: 400 }
      );
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "Liste d'articles requise." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async tx => {
      for (const row of items) {
        const produitId = row.produitId ?? row.id;
        const q = parseFloat(row.quantite);
        if (!produitId || !Number.isFinite(q) || q <= 0) continue;
        await applyStockDelta(tx, { produitId, entrepotId, delta: q });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/produits/stock:", error);
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    if (isStockError(error)) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status || 400 }
      );
    }
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
