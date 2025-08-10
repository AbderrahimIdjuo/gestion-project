import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
    const { date, numero, fournisseurId, orderGroups } = response;
    const DevisNumbers = orderGroups.map((g) => g.devisNumber);

    const result = await prisma.$transaction(
      async (prisma) => {
        await prisma.devis.updateMany({
          where: {
            numero: { in: DevisNumbers },
          },
          data: {
            statut: "Accepté",
          },
        });
        await prisma.commandeFourniture.create({
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
      },
      {
        // Temps max d’exécution de la transaction
        timeout: 60_000, // 15 s (par défaut 5_000 ms)
        // Temps max d’attente avant de démarrer (connexion/locks)
        maxWait: 5_000, // optionnel
        // isolationLevel: "ReadCommitted", // optionnel
      }
    );

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
    const { id, date, fournisseurId, orderGroups } = response;

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
  const from = searchParams.get("from"); // Start date
  const to = searchParams.get("to"); // End date
  const filters = {};
  const commandesPerPage = 10;

  // Search filter by produit designation , fournisseur
  filters.OR = [
    { fournisseur: { nom: { contains: searchQuery, mode: "insensitive" } } },
    { numero: { contains: searchQuery, mode: "insensitive" } },
  ];

  // Date range filter
  if (from && to) {
    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0); // Set to beginning of the day

    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999); // Set to end of the day

    filters.date = {
      gte: startDate, // Greater than or equal to start of "from" day
      lte: endDate, // Less than or equal to end of "to" day
    };
  }

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
