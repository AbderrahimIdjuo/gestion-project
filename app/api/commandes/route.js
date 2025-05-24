import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const requestBody = await req.json();
    const {
      numero,
      clientId,
      produits,
      statut,
      sousTotal,
      reduction,
      total,
      totalDevi,
      typeReduction,
      note,
      avance,
      compte,
      echeance,
    } = requestBody;

    // const produitsEnStock = produits.filter(
    //   (produit) => produit.stock >= produit.quantite
    // );
    // const produitsEnRupture = produits.filter(
    //   (produit) => produit.stock < produit.quantite
    // );

    // Update stock and create purchase orders for out-of-stock products
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Changer le statut du devi "Accepté" une fois la commande est créer
      await tx.devis.update({
        where: {
          numero: `DEV-${numero.slice(4, 13)}`,
        },
        data: {
          statut: "Accepté",
        },
      });

      //Update the price of products
      await Promise.all(
        produits.map((produit) =>
          tx.produits.update({
            where: { id: produit.id },
            data: { prixAchat: produit.prixUnite },
          })
        )
      );
      // Créer la commande
      const commande = await tx.commandes.create({
        data: {
          numero,
          clientId,
          statut,
          sousTotal: sousTotal,
          reduction: reduction || 0,
          total: total,
          typeReduction,
          note,
          totalDevi,
          echeance,
          avance: avance || 0,
          totalPaye: avance || 0,
          commandeProduits: {
            create: produits.map((produit) => ({
              produitId: produit.id,
              quantite: parseFloat(produit.quantite) || 0,
              prixUnite: produit.prixUnite || 0,
              montant: parseFloat(produit.quantite) * produit.prixUnite || 0,
            })),
          },
        },
      });

      //créer une transaction : paiement d'avance
      if (avance > 0) {
        await tx.transactions.create({
          data: {
            reference: numero,
            type: "recette",
            montant: avance,
            compte,
            lable: "avance",
          },
        });
        await tx.comptesBancaires.updateMany({
          where: { compte },
          data: {
            solde: { increment: avance },
          },
        });
      }

      // Mettre à jour le stock des produits en stock
      // await Promise.all(
      //   produitsEnStock.map((produit) =>
      //     tx.produits.update({
      //       where: { id: produit.id },
      //       data: {
      //         stock: { decrement: produit.quantite },
      //       },
      //     })
      //   )
      // );

      // Mettre le stock des produits en rupture à 0
      // await Promise.all(
      //   produitsEnRupture.map((produit) =>
      //     tx.produits.update({
      //       where: { id: produit.id },
      //       data: {
      //         stock: 0,
      //       },
      //     })
      //   )
      // );

      return commande;
    });

    return NextResponse.json({
      message: "Commande créée avec succès.",
      transactionResult,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de la commande." },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const response = await req.json();
    const {
      id,
      numero,
      produits,
      statut,
      sousTotal,
      reduction,
      total,
      typeReduction,
      note,
      echeance,
    } = response;
    console.log("response:", response);

    //    const [commandesAchats, produitsList] = await Promise.all(
    //   [
    //   prisma.achatsCommandes.findMany({ where: { commandeId: id } }),
    //     prisma.produits.findMany(),
    //   ]
    // );

    // const produitsCommandeMap = new Map(
    //   produitsCommande.map((p) => [p.produitId, p])
    // );
    // const produitsListMap = new Map(produitsList.map((p) => [p.id, p]));
    // const commandesAchatsMap = new Map(
    //   commandesAchats.map((c) => [c.produitId, c])
    // );
    const produitsCommande = await prisma.commandesProduits.findMany({
      where: { commandeId: id },
    });
    const existingIds = produits.map((p) => p.id);

    // Produits supprimés
    const productsToDelete = produitsCommande.filter(
      (p) => !existingIds.includes(p.produitId)
    );

    const result = await prisma.$transaction(async (tx) => {
      // Suppression des produits retirés de la commande
      if (productsToDelete.length > 0) {
        await tx.commandesProduits.deleteMany({
          where: { id: { in: productsToDelete.map((p) => p.id) } },
        });
      }

      // Mise à jour du stock pour les produits supprimés
      // await Promise.all(
      //   productsToDelete.map(async (item) => {
      //     const achat = commandesAchatsMap.get(item.produitId);
      //     // const produit = produitsListMap.get(item.produitId);
      //     const stockAdjustment = item.quantite - (achat?.quantite || 0);

      //     if (stockAdjustment > 0) {
      //       await tx.produits.update({
      //         where: { id: item.produitId },
      //         data: { stock: { increment: stockAdjustment } },
      //       });

      //       if (achat) {
      //         await tx.achatsCommandes.delete({
      //           where: {
      //             commandeId_produitId: {
      //               commandeId: id,
      //               produitId: item.produitId,
      //             },
      //           },
      //         });
      //       }
      //     }
      //   })
      // );

      // Mise à jour des stocks en fonction des modifications de quantité
      // await Promise.all(
      //   produits.map(async (item) => {
      //     const commandeProduit = produitsCommandeMap.get(item.id);
      //     const produit = produitsListMap.get(item.id);
      //     const achatCommande = commandesAchatsMap.get(item.id);

      //     if (!commandeProduit || !produit) return;

      //     const difference = Number(item.quantite) - commandeProduit.quantite;

      //     if (difference > 0) {
      //       // Si on ajoute plus de produits et le stock est insuffisant
      //       if (produit.stock - difference < 0) {
      //         await tx.produits.update({
      //           where: { id: item.id },
      //           data: { stock: 0 },
      //         });

      //         await tx.achatsCommandes.upsert({
      //           where: {
      //             commandeId_produitId: { commandeId: id, produitId: item.id },
      //           },
      //           update: { quantite: difference - produit.stock },
      //           create: {
      //             commandeId: id,
      //             produitId: item.id,
      //             quantite: difference - produit.stock,
      //             prixUnite: Number(item.prixUnite),
      //             payer: false,
      //             statut: "En cours",
      //             description: "Stock insuffisant, commande fournisseur créée",
      //           },
      //         });
      //       } else {
      //         await tx.produits.update({
      //           where: { id: item.id },
      //           data: { stock: { decrement: difference } },
      //         });
      //       }
      //     } else if (difference < 0) {
      //       // Si on diminue la quantité commandée, on restitue le stock
      //       if (produit.stock > 0) {
      //         await tx.produits.update({
      //           where: { id: item.id },
      //           data: { stock: { increment: -difference } },
      //         });

      //         if (achatCommande) {
      //           await tx.achatsCommandes.delete({
      //             where: {
      //               commandeId_produitId: {
      //                 commandeId: id,
      //                 produitId: item.id,
      //               },
      //             },
      //           });
      //         }
      //       }
      //     }
      //   })
      // );

      // Mise à jour de la commande et des produits associés
      return tx.commandes.update({
        where: { id },
        data: {
          numero,
          statut,
          sousTotal,
          reduction,
          total,
          typeReduction,
          echeance,
          note,
          commandeProduits: {
            upsert: produits.map((p) => ({
              where: {
                commandeId_produitId: { commandeId: id, produitId: p.id },
              },
              update: {
                quantite: Number(p.quantite),
                prixUnite: Number(p.prixUnite),
                montant: Number(p.quantite) * Number(p.prixUnite),
              },
              create: {
                produitId: p.id,
                quantite: Number(p.quantite),
                prixUnite: Number(p.prixUnite),
                montant: Number(p.quantite) * Number(p.prixUnite),
              },
            })),
          },
        },
      });
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la commande:", error);
    return NextResponse.json(
      { message: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("query") || "";
  const statut = searchParams.get("statut");
  const from = searchParams.get("from"); // Start date
  const to = searchParams.get("to"); // End date
  const minTotal = searchParams.get("minTotal");
  const maxTotal = searchParams.get("maxTotal");
  const etat = searchParams.get("etat");

  const filters = {};

  const commandesPerPage = 10;

  // Search filter by numero and client name
  filters.OR = [
    { numero: { contains: searchQuery } },
    { client: { nom: { contains: searchQuery, mode: "insensitive" } } },
  ];

  // Statut filter
  if (statut !== "all") {
    filters.statut = statut; // Filters by "depense" or "recette"
  }

  // Date range filter
  if (from && to) {
    filters.createdAt = {
      gte: new Date(from), // Greater than or equal to "from"
      lte: new Date(to), // Less than or equal to "to"
    };
  }

  // total range filter
  if (minTotal && maxTotal) {
    filters.total = {
      gte: Number(minTotal),
      lte: Number(maxTotal),
    };
  }

  // Etat filter
  if (etat !== "all") {
    switch (etat) {
      case "enPartie":
        filters.totalPaye = {
          lt: prisma.commandes.fields.totalDevi,
          gt: 0,
        };
        break;
      case "paye":
        filters.totalPaye = {
          gte: prisma.commandes.fields.totalDevi,
        };
        break;
      case "impaye":
        filters.totalPaye = 0;
        break;
    }
  }

  // Fetch filtered commandes with pagination and related data
  const [commandes, totalCommandes, commandeMaxTotal] = await Promise.all([
    prisma.commandes.findMany({
      where: filters,
      skip: (page - 1) * commandesPerPage,
      take: commandesPerPage,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        commandeProduits: {
          include: {
            produit: true,
          },
        },
      },
    }),
    prisma.commandes.count({ where: filters }), // Get total count for pagination
    prisma.commandes.findFirst({
      orderBy: {
        total: "desc", // Get the commande with the maximum total
      },
      select: {
        total: true, // Only fetch the total field
      },
    }),
  ]);

  // Extract commande numbers for transaction lookup
  const commandesNumeros = commandes.map((c) => c.numero);

  // Fetch transactions for the commandes
  const transactionsList = await prisma.transactions.findMany({
    where: { reference: { in: commandesNumeros } },
  });

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalCommandes / commandesPerPage);

  // Return the response
  return NextResponse.json({
    commandes,
    totalPages,
    transactionsList,
    maxMontant: commandeMaxTotal?.total || 0,
  });
}

export async function DELETE(req) {
  try {
    // Parse the JSON body
    const { ids } = await req.json();

    // Validate the input
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: "Invalid or missing IDs" },
        { status: 400 }
      );
    }

    // Perform the deletion
    const result = await prisma.articls.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    // Return success response
    return NextResponse.json({ message: `${result.count} records deleted.` });
  } catch (error) {
    console.error("Error deleting records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
