import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const requestBody = await req.json();
    const {
      numero,
      clientId,
      produits,
      statut,
      sousTotal,
      fraisLivraison,
      reduction,
      total,
      typeReduction,
      note,
      avance,
      compte,
      echeance,
    } = requestBody;

    const produitsEnStock = produits.filter(
      (produit) => produit.stock >= produit.quantite
    );
    const produitsEnRupture = produits.filter(
      (produit) => produit.stock < produit.quantite
    );

    console.log("Produits en stock:", produitsEnStock);
    console.log("Produits en rupture:", produitsEnRupture);

    // Update stock and create purchase orders for out-of-stock products
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Créer la commande
      const commande = await tx.commandes.create({
        data: {
          numero,
          clientId,
          statut,
          sousTotal: sousTotal,
          fraisLivraison: fraisLivraison || 0,
          reduction: reduction || 0,
          total: total,
          typeReduction,
          note,
          echeance,
          avance: avance || 0,
          totalPaye: avance || 0,
          commandeProduits: {
            create: produits.map((produit) => ({
              produitId: produit.id,
              quantite: produit.quantite || 0,
              prixUnite: produit.prixUnite || 0,
              montant: produit.quantite * produit.prixUnite || 0,
            })),
          },
          achatsCommande: {
            create: produitsEnRupture.map((produit) => ({
              produitId: produit.id,
              quantite: produit.quantite - produit.stock,
              prixUnite: produit.prixUnite,
              payer: false,
              description: produit.description,
              statut: "En cours",
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
      }

      // Mettre à jour le stock des produits en stock
      await Promise.all(
        produitsEnStock.map((produit) =>
          tx.produits.update({
            where: { id: produit.id },
            data: {
              stock: { decrement: produit.quantite },
            },
          })
        )
      );

      // Mettre le stock des produits en rupture à 0
      await Promise.all(
        produitsEnRupture.map((produit) =>
          tx.produits.update({
            where: { id: produit.id },
            data: {
              stock: 0,
            },
          })
        )
      );

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
      fraisLivraison,
      reduction,
      total,
      typeReduction,
      note,
      echeance,
    } = response;
    console.log("response:", response);

    // Récupération des données nécessaires en une seule requête
    const [produitsCommande, commandesAchats, produitsList] = await Promise.all(
      [
        prisma.commandesProduits.findMany({ where: { commandeId: id } }),
        prisma.achatsCommandes.findMany({ where: { commandeId: id } }),
        prisma.produits.findMany(),
      ]
    );

    const produitsCommandeMap = new Map(
      produitsCommande.map((p) => [p.produitId, p])
    );
    const produitsListMap = new Map(produitsList.map((p) => [p.id, p]));
    const commandesAchatsMap = new Map(
      commandesAchats.map((c) => [c.produitId, c])
    );

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
      await Promise.all(
        productsToDelete.map(async (item) => {
          const achat = commandesAchatsMap.get(item.produitId);
         // const produit = produitsListMap.get(item.produitId);
          const stockAdjustment = item.quantite - (achat?.quantite || 0);

          if (stockAdjustment > 0) {
            await tx.produits.update({
              where: { id: item.produitId },
              data: { stock: { increment: stockAdjustment } },
            });

            if (achat) {
              await tx.achatsCommandes.delete({
                where: {
                  commandeId_produitId: {
                    commandeId: id,
                    produitId: item.produitId,
                  },
                },
              });
            }
          }
        })
      );

      // Mise à jour des stocks en fonction des modifications de quantité
      await Promise.all(
        produits.map(async (item) => {
          const commandeProduit = produitsCommandeMap.get(item.id);
          const produit = produitsListMap.get(item.id);
          const achatCommande = commandesAchatsMap.get(item.id);

          if (!commandeProduit || !produit) return;

          const difference = Number(item.quantite) - commandeProduit.quantite;

          if (difference > 0) {
            // Si on ajoute plus de produits et le stock est insuffisant
            if (produit.stock - difference < 0) {
              await tx.produits.update({
                where: { id: item.id },
                data: { stock: 0 },
              });

              await tx.achatsCommandes.upsert({
                where: {
                  commandeId_produitId: { commandeId: id, produitId: item.id },
                },
                update: { quantite: difference - produit.stock },
                create: {
                  commandeId: id,
                  produitId: item.id,
                  quantite: difference - produit.stock,
                  prixUnite: Number(item.prixUnite),
                  payer: false,
                  statut: "En cours",
                  description: "Stock insuffisant, commande fournisseur créée",
                },
              });
            } else {
              await tx.produits.update({
                where: { id: item.id },
                data: { stock: { decrement: difference } },
              });
            }
          } else if (difference < 0) {
            // Si on diminue la quantité commandée, on restitue le stock
            if (produit.stock > 0) {
              await tx.produits.update({
                where: { id: item.id },
                data: { stock: { increment: -difference } },
              });

              if (achatCommande) {
                await tx.achatsCommandes.delete({
                  where: {
                    commandeId_produitId: {
                      commandeId: id,
                      produitId: item.id,
                    },
                  },
                });
              }
            }
          }
        })
      );

      // Mise à jour de la commande et des produits associés
      return tx.commandes.update({
        where: { id },
        data: {
          numero,
          statut,
          sousTotal,
          fraisLivraison,
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

// export async function PUT(req) {
//   try {
//     const response = await req.json();
//     const {
//       id,
//       numero,
//       produits,
//       statut,
//       sousTotal,
//       fraisLivraison,
//       reduction,
//       total,
//       typeReduction,
//       note,
//       echeance,
//     } = response;
//     console.log("response:", response);
//     // Récupérer les produits associés à la commande client
//     const produitsCommande = await prisma.commandesProduits.findMany({
//       where: {
//         commandeId: id,
//       },
//     });
//     const existingIds = produits.map((produit) => produit.id);
//     console.log("existingIds", existingIds);
//     // Récupérer les commandes achats liés à cette commande
//     const commandesAchats = await prisma.achatsCommandes.findMany({
//       where: {
//         commandeId: id,
//       },
//     });
//     // Récupérer la list de tous les produits
//     const produitsList = await prisma.produits.findMany();
//     // les produits suprimés de la commande client
//     const productsToDelete = await prisma.commandesProduits.findMany({
//       where: {
//         commandeId: id,
//         produitId: { notIn: existingIds },
//       },
//     });
//     //console.log("productsToDelete", productsToDelete);

//     const result = await prisma.$transaction(async (tx) => {
//       // Step 1: Delete products that are no longer part of the order
//       if (productsToDelete.length > 0) {
//         await tx.commandesProduits.deleteMany({
//           where: {
//             id: { in: productsToDelete.map((p) => p.id) },
//           },
//         });
//       }
//       // Step 2: Restore stock for deleted products
//       const updatingDeletedProductsStock = productsToDelete.map((item1) => {
//         const item2 = commandesAchats.find(
//           (item) => item.produitId === item1.produitId
//         );
//         const produitsQuantite = item1.quantite; // Quantity in customer order
//         const commandesQuantite = item2 ? item2.quantite : 0; // Quantity ordered from supplier

//         if (!item2) {
//           return {
//             update: tx.produits.update({
//               where: { id: item1.produitId },
//               data: { stock: { increment: produitsQuantite } },
//             }),
//             delete: null,
//           };
//         } else if (
//           produitsQuantite > commandesQuantite &&
//           commandesQuantite > 0
//         ) {
//           return {
//             update: tx.produits.update({
//               where: { id: item1.produitId },
//               data: {
//                 stock: { increment: produitsQuantite - commandesQuantite },
//               },
//             }),
//             delete: tx.achatsCommandes.delete({
//               where: {
//                 commandeId_produitId: {
//                   commandeId: id,
//                   produitId: item1.produitId,
//                 },
//               },
//             }),
//           };
//         } else if (produitsQuantite === commandesQuantite) {
//           return {
//             update: null, // No stock update needed
//             delete: tx.achatsCommandes.delete({
//               where: {
//                 commandeId_produitId: {
//                   commandeId: id,
//                   produitId: item1.produitId,
//                 },
//               },
//             }),
//           };
//         }
//       });

//       // Execute stock updates
//       await Promise.all(
//         updatingDeletedProductsStock.map((item) => item.update).filter(Boolean)
//       );

//       // Execute supplier order deletions
//       await Promise.all(
//         updatingDeletedProductsStock.map((item) => item.delete).filter(Boolean)
//       );
//       // Step 3: Restore stock for updating products quantite in the list of products
//       const updatingProduitsCommande = produits.map((item1) => {
//         const item2 = produitsCommande.find(
//           (item) => item.produitId === item1.id && item.commandeId === id
//         );
//         const item3 = produitsList.find((item) => item.id === item1.id);
//         const item4 = commandesAchats.find(
//           (item) => item.produitId === item1.id && item.commandeId === id
//         );
//         const produitsQuantite = item1.quantite; // Quantity in customer order
//         const produitcommandesQuantite = item2 ? item2.quantite : 0; // Previous quantity in order
//         const diff = produitsQuantite - produitcommandesQuantite;
//         console.log("stok - diff : ", item3.stock - diff);
//         if (item2) {
//           if (diff > 0 && produitcommandesQuantite > 0) {
//             if (item3.stock - diff > 0) {
//               return {
//                 produitId: item1.id,
//                 designation: item1.designation,
//                 conclusion: `La quantité a augmenté de ${diff}`,
//                 update: tx.produits.update({
//                   where: { id: item1.id },
//                   data: { stock: { decrement: diff } },
//                 }),
//               };
//             } else if (item3.stock - diff < 0) {
//               return {
//                 produitId: item1.id,
//                 designation: item1.designation,
//                 conclusion: `le stock diminue par ${-diff} et une demande d'achat est crée`,
//                 update: tx.produits.update({
//                   where: { id: item1.id },
//                   data: { stock: 0 },
//                 }),
//                 create: tx.achatsCommandes.create({
//                   data: {
//                     commandeId: id,
//                     produitId: item1.id,
//                     quantite: diff - item3.stock,
//                     prixUnite: item1.prixUnite,
//                     payer: false,
//                     statut: "En cours",
//                     description: `le stock diminue par ${-diff} et une demande d'achat est crée`,
//                   },
//                 }),
//               };
//             }
//           } else if (diff < 0 && produitcommandesQuantite > 0) {
//             if (item3.stock > 0) {
//               return {
//                 produitId: item1.id,
//                 designation: item1.designation,
//                 conclusion: `Le stock est augmenter par ${-diff}`,
//                 update: tx.produits.update({
//                   where: { id: item1.id },
//                   data: { stock: { increment: -diff } },
//                 }),
//               };
//             } else if (item3.stock === 0) {
//               console.log("item4", item4);
//               console.log("item4.quantite", item4.quantite);

//               return {
//                 produitId: item1.id,
//                 designation: item1.designation,
//                 conclusion: `Le stock est augmenter par ${-diff}`,
//                 update: tx.produits.update({
//                   where: { id: item1.id },
//                   data: { stock: { increment: -diff - item4.quantite } },
//                 }),
//                 delete: tx.achatsCommandes.delete({
//                   where: {
//                     commandeId_produitId: {
//                       commandeId: id,
//                       produitId: item1.id,
//                     },
//                   },
//                 }),
//               };
//             }
//           } else if (diff === 0) {
//             return {
//               produitId: item1.id,
//               designation: item1.designation,
//               conclusion: `Le stock n'est pas modifié`,
//              update: null,
//             };
//           }
//         }
//         // return null;}
//       });

//       // Execute stock updates
//       await Promise.all(
//         updatingProduitsCommande.map((item) => item.update).filter(Boolean)
//       );
//       // Execute purchase creation
//       await Promise.all(
//         updatingProduitsCommande.map((item) => item.create).filter(Boolean)
//       );
//       // Execute delete commande
//       await Promise.all(
//         updatingProduitsCommande.map((item) => item.delete).filter(Boolean)
//       );
//       // Step 3: Update the order and upsert related products
//       return tx.commandes.update({
//         where: { id },
//         data: {
//           numero,
//           statut,
//           sousTotal,
//           fraisLivraison,
//           reduction,
//           total,
//           typeReduction,
//           echeance,
//           note,
//           commandeProduits: {
//             upsert: produits.map((articl) => ({
//               where: {
//                 commandeId_produitId: {
//                   commandeId: id,
//                   produitId: articl.id,
//                 },
//               },
//               update: {
//                 quantite: parseInt(articl.quantite),
//                 prixUnite: parseFloat(articl.prixUnite),
//                 montant:
//                   parseInt(articl.quantite) * parseFloat(articl.prixUnite),
//               },
//               create: {
//                 produitId: articl.id,
//                 quantite: parseInt(articl.quantite),
//                 prixUnite: parseFloat(articl.prixUnite),
//                 montant:
//                   parseInt(articl.quantite) * parseFloat(articl.prixUnite),
//               },
//             })),
//           },
//         },
//       });
//     });

//     return NextResponse.json({ result });
//   } catch (error) {
//     console.log(error);

//     return NextResponse.json(
//       { message: "An unexpected error occurred." },
//       { status: 500 }
//     );
//   }
// }

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
    { client: { nom: { contains: searchQuery } } },
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
          lt: prisma.commandes.fields.total,
          gt: 0,
        };
        break;
      case "paye":
        filters.totalPaye = {
          equals: prisma.commandes.fields.total,
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
    maxMontant: commandeMaxTotal.total,
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
