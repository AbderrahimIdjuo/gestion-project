import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(_, { params }) {
  const numero = params.numero;
  console.log("Fetching order groups for numero #####:", numero);

  const orderGroups = await prisma.ordersGroups.findMany({
    where: { devisNumero: numero },
    include: {
      commandeFourniture: {
        select: {
          numero: true,
          fournisseur: {
            select: {
              nom: true,
            },
          },
        },
      },
      produits: {
        include: {
          produit: {
            select: {
              designation: true,
              prixAchat: true,
            },
          },
        },
      },
    },
  });
  return NextResponse.json({ orderGroups });
}
