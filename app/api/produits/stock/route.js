import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST { items: [{ produitId: string, quantite: number }, ...] }
 * Augmente le stock de chaque produit (quantités positives uniquement).
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const items = body?.items;
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

        const p = await tx.produits.findUnique({
          where: { id: produitId },
          select: { stock: true },
        });
        if (!p) continue;

        await tx.produits.update({
          where: { id: produitId },
          data: { stock: (p.stock ?? 0) + q },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/produits/stock:", error);
    return NextResponse.json(
      { message: "Erreur serveur." },
      { status: 500 }
    );
  }
}
