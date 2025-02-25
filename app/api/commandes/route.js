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
          sousTotal: sousTotal ,
          fraisLivraison: fraisLivraison || 0,
          reduction: reduction || 0,
          total: total,
          typeReduction,
          note,
          echeance,
          avance: avance || 0,
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
      avance,
      echeance,
    } = response;
    console.log("response:", response);
    // Récupérer les produits associés à la commande client
    const produitsCommande = await prisma.commandesProduits.findMany({
      where: {
        commandeId: id,
      },
    });
    const existingIds = produits.map((produit) => produit.id);
    console.log("existingIds", existingIds);
    // Récupérer les commandes achats liés à cette commande
    const commandesAchats = await prisma.achatsCommandes.findMany({
      where: {
        commandeId: id,
      },
    });
    // Récupérer la list de tous les produits
    const produitsList = await prisma.produits.findMany();
    // les produits suprimés de la commande client
    const productsToDelete = await prisma.commandesProduits.findMany({
      where: {
        commandeId: id,
        produitId: { notIn: existingIds },
      },
    });
    //console.log("productsToDelete", productsToDelete);

    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Delete products that are no longer part of the order
      if (productsToDelete.length > 0) {
        await tx.commandesProduits.deleteMany({
          where: {
            id: { in: productsToDelete.map((p) => p.id) },
          },
        });
      }
      // Step 2: Restore stock for deleted products
      const updatingDeletedProductsStock = productsToDelete.map((item1) => {
        const item2 = commandesAchats.find(
          (item) => item.produitId === item1.produitId
        );
        const produitsQuantite = item1.quantite; // Quantity in customer order
        const commandesQuantite = item2 ? item2.quantite : 0; // Quantity ordered from supplier

        if (!item2) {
          return {
            update: tx.produits.update({
              where: { id: item1.produitId },
              data: { stock: { increment: produitsQuantite } },
            }),
            delete: null,
          };
        } else if (
          produitsQuantite > commandesQuantite &&
          commandesQuantite > 0
        ) {
          return {
            update: tx.produits.update({
              where: { id: item1.produitId },
              data: {
                stock: { increment: produitsQuantite - commandesQuantite },
              },
            }),
            delete: tx.achatsCommandes.delete({
              where: {
                commandeId_produitId: {
                  commandeId: id,
                  produitId: item1.produitId,
                },
              },
            }),
          };
        } else if (produitsQuantite === commandesQuantite) {
          return {
            update: null, // No stock update needed
            delete: tx.achatsCommandes.delete({
              where: {
                commandeId_produitId: {
                  commandeId: id,
                  produitId: item1.produitId,
                },
              },
            }),
          };
        }
      });

      // Execute stock updates
      await Promise.all(
        updatingDeletedProductsStock.map((item) => item.update).filter(Boolean)
      );

      // Execute supplier order deletions
      await Promise.all(
        updatingDeletedProductsStock.map((item) => item.delete).filter(Boolean)
      );
      // Step 3: Restore stock for updating products quantite in the list of products
      const updatingProduitsCommande = produits.map((item1) => {
        const item2 = produitsCommande.find(
          (item) => item.produitId === item1.id && item.commandeId === id
        );
        const item3 = produitsList.find((item) => item.id === item1.id);
        const item4 = commandesAchats.find(
          (item) => item.produitId === item1.id && item.commandeId === id
        );
        const produitsQuantite = item1.quantite; // Quantity in customer order
        const produitcommandesQuantite = item2 ? item2.quantite : 0; // Previous quantity in order
        const diff = produitsQuantite - produitcommandesQuantite;
        console.log("stok - diff : ", item3.stock - diff);
        if (item2) {
          if (diff > 0 && produitcommandesQuantite > 0) {
            if (item3.stock - diff > 0) {
              return {
                produitId: item1.id,
                designation: item1.designation,
                conclusion: `La quantité a augmenté de ${diff}`,
                update: tx.produits.update({
                  where: { id: item1.id },
                  data: { stock: { decrement: diff } },
                }),
              };
            } else if (item3.stock - diff < 0) {
              return {
                produitId: item1.id,
                designation: item1.designation,
                conclusion: `le stock diminue par ${-diff} et une demande d'achat est crée`,
                update: tx.produits.update({
                  where: { id: item1.id },
                  data: { stock: 0 },
                }),
                create: tx.achatsCommandes.create({
                  data: {
                    commandeId: id,
                    produitId: item1.id,
                    quantite: diff - item3.stock,
                    prixUnite: item1.prixUnite,
                    payer: false,
                    statut: "En cours",
                    description: `le stock diminue par ${-diff} et une demande d'achat est crée`,
                  },
                }),
              };
            }
          } else if (diff < 0 && produitcommandesQuantite > 0) {
            if (item3.stock > 0) {
              return {
                produitId: item1.id,
                designation: item1.designation,
                conclusion: `Le stock est augmenter par ${-diff}`,
                update: tx.produits.update({
                  where: { id: item1.id },
                  data: { stock: { increment: -diff } },
                }),
              };
            } else if (item3.stock === 0) {
              console.log("item4", item4);
              console.log("item4.quantite", item4.quantite);

              return {
                produitId: item1.id,
                designation: item1.designation,
                conclusion: `Le stock est augmenter par ${-diff}`,
                update: tx.produits.update({
                  where: { id: item1.id },
                  data: { stock: { increment: -diff - item4.quantite } },
                }),
                delete: tx.achatsCommandes.delete({
                  where: {
                    commandeId_produitId: {
                      commandeId: id,
                      produitId: item1.id,
                    },
                  },
                }),
              };
            }
          } else if (diff === 0) {
            return {
              produitId: item1.id,
              designation: item1.designation,
              conclusion: `Le stock n'est pas modifié`,
              update: null,
            };
          }
        }
        // return null;}
      });

      // Execute stock updates
      await Promise.all(
        updatingProduitsCommande.map((item) => item.update).filter(Boolean)
      );
      // Execute purchase creation
      await Promise.all(
        updatingProduitsCommande.map((item) => item.create).filter(Boolean)
      );
      // Execute delete commande
      await Promise.all(
        updatingProduitsCommande.map((item) => item.delete).filter(Boolean)
      );
      // Step 3: Update the order and upsert related products
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
          avance,
          echeance,
          note,
          commandeProduits: {
            upsert: produits.map((articl) => ({
              where: {
                commandeId_produitId: {
                  commandeId: id,
                  produitId: articl.id,
                },
              },
              update: {
                quantite: parseInt(articl.quantite),
                prixUnite: parseFloat(articl.prixUnite),
                montant:
                  parseInt(articl.quantite) * parseFloat(articl.prixUnite),
              },
              create: {
                produitId: articl.id,
                quantite: parseInt(articl.quantite),
                prixUnite: parseFloat(articl.prixUnite),
                montant:
                  parseInt(articl.quantite) * parseFloat(articl.prixUnite),
              },
            })),
          },
        },
      });
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const commandes = await prisma.commandes.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      client: true,
      commandeProduits: true,
    },
  });
  return NextResponse.json({ commandes });
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
