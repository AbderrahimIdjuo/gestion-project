import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
    const {
      date,
      numero,
      fournisseurId,
      bLGroups,
      total,
      totalPaye,
      type,
      reference,
    } = response;
    console.log("response ##### :", response);
    const result = await prisma.$transaction(async (prisma) => {
      await prisma.bonLivraison.create({
        data: {
          date: date || new Date(),
          numero,
          total: parseFloat(total),
          reference,
          type,
          totalPaye: parseFloat(totalPaye) || 0,
          fournisseur: {
            connect: { id: fournisseurId },
          },
          groups: {
            create: bLGroups.map((group) => ({
              id: group.id,
              devisNumero: group.devisNumber,
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
      // Mettre a jour les prixUnite des produits dans la CMDF
      // Étape 1 : Récupérer la commande fourniture
      // const commande = await prisma.commandeFourniture.findUnique({
      //   where: { numero: commandeFourniture },
      //   include: {
      //     fournisseur: {
      //       select: {
      //         nom: true,
      //       },
      //     },
      //     groups: {
      //       include: {
      //         produits: {
      //           include: {
      //             produit: true,
      //           },
      //         },
      //       },
      //     },
      //   },
      // });
      // Étape 2 : Créer une map pour un accès rapide au nouveau prix
      const produits = bLGroups.flatMap((group) => group.items);
      console.log("produits ##### :", produits);
      const prixMap = new Map(produits.map((p) => [p.id, p.prixUnite]));

      // Étape 3 : Mettre à jour chaque ListProduits concerné
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

      // Étape 4 : Exécuter toutes les mises à jour
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
  const bonLivraisonPerPage = 10;

  // Search filter by produit designation , fournisseur
  filters.OR = [
    { fournisseur: { nom: { contains: searchQuery, mode: "insensitive" } } },
    { numero: { contains: searchQuery, mode: "insensitive" } },
    { reference: { contains: searchQuery, mode: "insensitive" } },
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
  const [bonLivraison, totalBonLivraison, lastBonLivraison] = await Promise.all(
    [
      prisma.bonLivraison.findMany({
        where: filters,
        skip: (page - 1) * bonLivraisonPerPage,
        take: bonLivraisonPerPage,
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
      prisma.bonLivraison.count({ where: filters }),
      prisma.bonLivraison.findFirst({
        orderBy: { createdAt: "desc" },
      }),
    ]
  );

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalBonLivraison / bonLivraisonPerPage);

  // Return the response
  return NextResponse.json({
    bonLivraison,
    totalPages,
    lastBonLivraison,
  });
}
