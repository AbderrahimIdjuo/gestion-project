import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
    const {
      bLGroups,
    } = response;

    const result = await prisma.$transaction(async (prisma) => {
      // Mettre a jour les prixUnite des produits 

      // Étape 1 : Créer une map pour un accès rapide au nouveau prix
      const produits = bLGroups.flatMap((group) => group.items);
      const prixMap = new Map(produits.map((p) => [p.id, p.prixUnite]));

      // Étape 2 : Mettre à jour chaque blGroupsProduits concerné
      const updates = [];

      // mettre a jours le prix achats des produits

      for (const produit of produits) {
        const nouveauPrix = prixMap.get(produit.id);
        if (nouveauPrix !== undefined) {
          updates.push(
            prisma.produits.update({
              where: { id: produit.id },
              data: { prixAchat: nouveauPrix },
            })
          );
        }
      }

      // Étape 3 : Exécuter toutes les mises à jour
      await Promise.all(updates);
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error creating BL:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
