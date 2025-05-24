import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
    console.log("data : ", response);

    const { numero, fournisseurId, orderGroups } = response;
    const result = await prisma.commandeFourniture.create({
      data: {
        numero,
        fournisseur: {
          connect: { id: fournisseurId },
        },
        groups: {
          create: orderGroups.map((group) => ({
            id: group.id,
            commandeNumero: group.commande,
            clientName : group.clientName,
            produits: {
              create: group.items.map((produit) => ({
                produit: {
                  connect: { id: produit.id },
                },
                quantite: produit.quantite,
              })),
            },
          })),
        },
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error creating commandeFourniture:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const response = await req.json();
    const {
      id,
      designation,
      categorie,
      prixAchat,
      prixVente,
      statu,
      stock,
      description,
    } = response;

    const result = await prisma.produits.update({
      where: { id },
      data: {
        designation,
        categorie,
        prixAchat: parseFloat(prixAchat),
        prixVente: parseFloat(prixVente),
        statut: statu,
        stock: parseInt(stock, 10),
        description,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("query") || "";
  const statutPaiement = searchParams.get("statutPaiement");
  const categorie = searchParams.get("categorie")
    ? decodeURIComponent(searchParams.get("categorie").trim())
    : null;
  const filters = {};
  const commandesPerPage = 10;

  // Search filter by produit designation , fournisseur
  filters.OR = [
    { fournisseur: { nom: { contains: searchQuery, mode: "insensitive" } } },
    { numero: { contains: searchQuery } },
  ];

  // // Filters par statutPaiement : "payé" ou "impayé"
  // if (statutPaiement !== "all") {
  //   if (statutPaiement === "true") {
  //     filters.payer = true;
  //   } else if (statutPaiement === "false") {
  //     filters.payer = false;
  //   }
  // }

  // // Filters par categorie
  // if (categorie !== "all") {
  //   filters.produit = {
  //     categorie: {
  //       equals: categorie,
  //     },
  //   };
  // }

  // Fetch filtered commandes with pagination and related data
  const [commandes, totalCommandes] = await Promise.all([
    prisma.commandeFourniture.findMany({
      where: filters,
      skip: (page - 1) * commandesPerPage,
      take: commandesPerPage,
      orderBy: { createdAt: "desc" },
      include: {
        fournisseur: {
          select: {
            nom: true,
          },
        },
        groups: {
          include: {
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
        },
      },
    }),
    prisma.commandeFourniture.count({ where: filters }),
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalCommandes / commandesPerPage);

  // Return the response
  return NextResponse.json({
    commandes,
    totalPages,
  });
}
