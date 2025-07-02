import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
    const { date, numero, fournisseurId, orderGroups } = response;
    console.log("response commande ##### :", response);
    const DevisNumbers = orderGroups.map((g) => g.devisNumber);
    await prisma.devis.updateMany({
      where: {
        numero: { in: DevisNumbers },
      },
      data: {
        statut: "Accepté",
      },
    });
    const result = await prisma.commandeFourniture.create({
      data: {
        date,
        numero,
        fournisseur: {
          connect: { id: fournisseurId },
        },
        groups: {
          create: orderGroups.map((group) => ({
            id: group.id,
            devisNumero: group.devisNumber, // commandeNumero = devisNumber
            clientName: group.clientName,
            produits: {
              create: group.items.map((produit) => ({
                produit: {
                  connect: { id: produit.id },
                },
                quantite: parseFloat(produit.quantite),
                prixUnite: parseFloat(produit.prixUnite),
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
    const { id, date, numero, fournisseurId, orderGroups } = response;

    // 1. Récupérer les groups existants
    const existing = await prisma.commandeFourniture.findUnique({
      where: { id },
      include: {
        groups: {
          select: { id: true },
        },
      },
    });

    const existingGroupIds = existing?.groups.map((g) => g.id) || [];
    const incomingGroupIds = orderGroups.map((group) => group.id);

    // 2. Supprimer les groups retirés
    const groupsToDelete = existingGroupIds.filter(
      (existingId) => !incomingGroupIds.includes(existingId)
    );

    await prisma.ordersGroups.deleteMany({
      where: {
        id: { in: groupsToDelete },
      },
    });

    // 3. Pour chaque group, supprimer les produits retirés
    for (const group of orderGroups) {
      const existingProduits = await prisma.listProduits.findMany({
        where: { groupId: group.id },
        select: { produitId: true },
      });

      const existingProduitIds = existingProduits.map((p) => p.produitId);
      const incomingProduitIds = group.items.map((p) => p.id);

      const produitsToDelete = existingProduitIds.filter(
        (produitId) => !incomingProduitIds.includes(produitId)
      );

      if (produitsToDelete.length > 0) {
        await prisma.listProduits.deleteMany({
          where: {
            groupId: group.id,
            produitId: { in: produitsToDelete },
          },
        });
      }
    }

    // 4. Upsert commandeFourniture avec groupes et produits
    const result = await prisma.commandeFourniture.update({
      where: { id },
      data: {
        date,
        fournisseur: {
          connect: { id: fournisseurId },
        },
        groups: {
          upsert: orderGroups.map((group) => ({
            where: { id: group.id },
            update: {
              devisNumero: group.devisNumber,
              clientName: group.clientName,
              produits: {
                upsert: group.items.map((produit) => ({
                  where: {
                    groupId_produitId: {
                      groupId: group.id,
                      produitId: produit.id,
                    },
                  },
                  update: {
                    quantite: parseFloat(produit.quantite),
                    prixUnite: parseFloat(produit.prixUnite),
                    produit: {
                      connect: { id: produit.id },
                    },
                  },
                  create: {
                    quantite: parseFloat(produit.quantite),
                    prixUnite: parseFloat(produit.prixUnite),
                    produit: {
                      connect: { id: produit.id },
                    },
                  },
                })),
              },
            },
            create: {
              id: group.id,
              devisNumero: group.devisNumber,
              clientName: group.clientName,
              produits: {
                create: group.items.map((produit) => ({
                  quantite: parseFloat(produit.quantite),
                  prixUnite: parseFloat(produit.prixUnite),
                  produit: {
                    connect: { id: produit.id },
                  },
                })),
              },
            },
          })),
        },
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error(
      "Error upserting commandeFourniture with nested upserts:",
      error
    );
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
  const [commandes, lastCommande, totalCommandes] = await Promise.all([
    prisma.commandeFourniture.findMany({
      where: filters,
      skip: (page - 1) * commandesPerPage,
      take: commandesPerPage,
      orderBy: { createdAt: "desc" },
      include: {
        fournisseur: {
          select: {
            nom: true,
            id: true,
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
    prisma.commandeFourniture.findFirst({
      orderBy: { createdAt: "desc" },
    }),
    prisma.commandeFourniture.count({ where: filters }),
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalCommandes / commandesPerPage);

  // Return the response
  return NextResponse.json({
    commandes,
    lastCommande,
    totalPages,
  });
}
