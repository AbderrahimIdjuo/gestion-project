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
    const transactionResult = await prisma.$transaction([
      // Create the main order
      prisma.commandes.create({
        data: {
          numero,
          clientId,
          statut,
          sousTotal: parseFloat(sousTotal) || 0,
          fraisLivraison: parseFloat(fraisLivraison) || 0,
          reduction: parseInt(reduction, 10) || 0,
          total: parseFloat(total) || 0,
          typeReduction,
          note,
          echeance,
          avance: parseInt(avance, 10) || 0,
          commandeProduits: {
            create: produits.map((produit) => ({
              produitId: produit.id,
              quantite: parseInt(produit.quantite, 10) || 0,
              prixUnite: parseFloat(produit.prixUnite) || 0,
              montant:
                parseFloat(
                  (
                    parseInt(produit.quantite, 10) *
                    parseFloat(produit.prixUnite)
                  ).toFixed(2)
                ) || 0,
            })),
          },
          //Crée une commande de produits en rupture de stock au fournisseur
          achatsCommande: {
            create: produitsEnRupture.map((produit) => ({
              produitId: produit.id,
              quantite: parseInt(produit.quantite - produit.stock, 10),
              prixUnite: parseFloat(produit.prixUnite),
              payer: false,
              description: produit.description,
              statut: "En cours",
            })),
          },
        },
      }),

      //Modifier le stock pour les prouduits en stock
      ...produitsEnStock.map((produit) =>
        prisma.produits.update({
          where: { id: produit.id },
          data: {
            stock: produit.stock - produit.quantite,
          },
        })
      ),
      //Modifier le stock pour les prouduits en rupture de stock
      ...produitsEnRupture.map((produit) =>
        prisma.produits.update({
          where: { id: produit.id },
          data: {
            stock: 0,
          },
        })
      ),
    ]);

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

// export async function PUT(req) {
//   try {
//     const response = await req.json();
//     const {
//       id,
//       numero,
//       clientId,
//       produits,
//       statut,
//       sousTotal,
//       fraisLivraison,
//       reduction,
//       total,
//       typeReduction,
//       note,
//       avance,
//       echeance,
//     } = response;

//     // Récupérer les produits associés à la commande client
//     const produitsCommande = await prisma.commandesProduits.findMany({
//       where: {
//         commandeId: id,
//       },
//     });
//     const produitsEnStock = produits.filter(
//       (produit) => produit.stock >= produit.quantite
//     );
//     const produitsEnRupture = produits.filter(
//       (produit) => produit.stock < produit.quantite
//     );
//     const existingIds = produits.map((produit) => produit.id);
//     // Produits supprimés de la liste de produits
//     const produitsSupprime = produitsCommande.filter(
//       (produit) => !existingIds.includes(produit.produitId)
//     );
//     // Récupérer les commandes achats liés à cette commande
//     const commandesAchats = await prisma.achatsCommandes.findMany({
//       where: {
//         commandeId: id,
//       },
//     });
//     console.log("produits", produits);
//     console.log("produitsCommande", produitsCommande);
//     console.log("existingIds:", existingIds);
//     console.log("response:", response);
//     // console.log("produitsEnRupture", produitsEnRupture);
//     // console.log("produitsSupprime", produitsSupprime);
//     // console.log("commandesAchats", commandesAchats);
// //     const updatingDeletedProducts = produitsSupprime.map((item1) => {
// //       const item2 = commandesAchats.find(
// //         (item) => item.produitId === item1.produitId
// //       );
// //       const produitsQuantite = item1.quantite; // la quanité de produits dans la commande de client
// //       const commandesQuantite = item2 ? item2.quantite : 0; // la quantité de produits demander au fornisseur
// //       let conclusion = "";

// //       // if (!item2) {
// //       //   conclusion = "Le stock est plein";
// //       //   return {
// //       //     produitId: item1.produitId,
// //       //     produits: produitsQuantite,
// //       //     commandes: commandesQuantite,
// //       //     difference: produitsQuantite,
// //       //     conclusion,
// //       //     update: prisma.produits.update({
// //       //       where: { id: item1.produitId },
// //       //       data: { stock: { increment: produitsQuantite } },
// //       //     }),
// //       //     delete: null,
// //       //   };
// //       // } else
// //       if (produitsQuantite > commandesQuantite && commandesQuantite > 0) {
// //         conclusion = `Le stock contient ${
// //           produitsQuantite - commandesQuantite
// //         }`;
// //         return {
// //           produitId: item1.produitId,
// //           produits: produitsQuantite,
// //           commandes: commandesQuantite,
// //           difference: produitsQuantite - commandesQuantite,
// //           conclusion,
// //           update: prisma.produits.update({
// //             where: { id: item1.produitId },
// //             data: {
// //               stock: { increment: produitsQuantite - commandesQuantite },
// //             },
// //           }),
// //           delete: prisma.achatsCommandes.delete({
// //             where: {
// //               id: item2.id,
// //             },
// //           }),
// //         };
// //       }
// //     //   else if (produitsQuantite === commandesQuantite) {
// //     //     conclusion = "Le stock est vide";
// //     //     return {
// //     //       produitId: item2.produitId,
// //     //       produits: produitsQuantite,
// //     //       commandes: commandesQuantite,
// //     //       difference: 0,
// //     //       conclusion,
// //     //       update: null, // Pas besoin de mise à jour
// //     //       delete: prisma.achatsCommandes.delete({
// //     //         where: {
// //     //           id: item2.id,
// //     //         },
// //     //       }),
// //     //     };
// //     //   }
// //     });

// //     const updatingUpdatedProducts = produits.map((item1) => {
// //       const item2 = produitsCommande.find(
// //         (item) => item.produitId === item1.id
// //       );
// //       const produitsQuantite = item1.quantite; // la quanité de produits dans la commande de client
// //       const produitcommandesQuantite = item2 ? item2.quantite : 0; // la quantité de produits demander au fornisseur
// //       const diff = produitsQuantite-produitcommandesQuantite

// // if(item2){

// //   if (diff>0 && produitcommandesQuantite > 0) {

// //     return {
// //       produitId:item1.id,
// //       designation:item1.designation,
// //       conclusion : `Le stock est augmenter de ${diff}`,
// //       }
// //     }else if (diff<0 && produitcommandesQuantite > 0){
// //       return {
// //         produitId:item1.id,
// //         designation:item1.designation,
// //         conclusion : `Le stock est diminué de ${-diff}`,
// //         }
// //     }else if (diff===0){
// //       return {
// //         produitId:item1.id,
// //         designation:item1.designation,
// //         conclusion : `Le stock est n'est pas modifié`,
// //         }
// //     }else{
// //       return {
// //         produitId:null,
// //         designation:null,
// //         conclusion : `null`,
// //         }
// //     }
// // }
// //       });
// //       console.log("updatingUpdatedProducts", updatingUpdatedProducts? updatingUpdatedProducts : "null");

//     // Filtrer les mises à jour nulles
//     // const updates = updatingDeletedProducts.map((item) => item.update).filter(Boolean);
//     // const deletes = updatingDeletedProducts.map((item) => item.delete).filter(Boolean);

//     const transactionResult = await prisma.$transaction([
//      // ...updates,
//      // ...deletes,
//       // Supprimer les produits supprimés
//       // prisma.commandesProduits.deleteMany({
//       //   where: {
//       //     commandeId: id,
//       //     id: {
//       //       notIn: existingIds, // Delete records not in the incoming produits array
//       //     },
//       //   },
//       // }),
//       // Modifier la commande du client
//       prisma.commandes.update({
//         where: { id },
//         data: {
//           numero,
//           clientId,
//           statut,
//           sousTotal: sousTotal,
//           fraisLivraison: fraisLivraison,
//           reduction: reduction,
//           total: total,
//           typeReduction,
//           avance,
//           echeance,
//           note,
//           description:"description",
//           commandeProduits: {
//             upsert: produits.map((articl) => ({
//               where: {
//                 commandeId_produitId: {
//                   commandeId: id,
//                   produitId: articl.id
//                 }
//               },
//               update: {
//                 produitId: articl.id,
//                 quantite: parseInt(articl.quantite),
//                 prixUnite: parseFloat(articl.prixUnite),
//                 montant: articl.quantite * articl.prixUnite,
//               },
//               create: {
//                 produitId: articl.id,
//                 quantite: parseInt(articl.quantite),
//                 prixUnite: parseFloat(articl.prixUnite),
//                 montant: articl.quantite * articl.prixUnite,
//               },
//             })),
//           },
//         },
//       }),
//  //Crée une commande de produits en rupture de stock au fournisseur
//       prisma.achatsCommandes.createMany({
//         data: produitsEnRupture.map((produit) => ({
//           produitId: produit.id,
//           quantite: parseInt(produit.quantite - produit.stock, 10),
//           prixUnite: parseFloat(produit.prixUnite),
//           payer: false,
//           description: produit.description,
//           statut: "En cours",
//         })),
//       }),
//       //Modifier le stock pour les prouduits en stock
//       ...produitsEnStock.map((produit) =>
//         prisma.produits.update({
//           where: { id: produit.id },
//           data: {
//             stock: produit.stock - produit.quantite,
//           },
//         })
//       ),
//       //Modifier le stock pour les prouduits en rupture de stock
//       ...produitsEnRupture.map((produit) =>
//         prisma.produits.update({
//           where: { id: produit.id },
//           data: {
//             stock: 0,
//           },
//         })
//       ),
//     ]);
//     return NextResponse.json({ transactionResult });
//   } catch (error) {
//     console.log(error);

//     return NextResponse.json(
//       { message: "An unexpected error occurred." },
//       { status: 500 }
//     );
//   }
// }

export async function PUT(req) {
  try {
    const response = await req.json();
    const {
      id,
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
    } = response;
    console.log("response:", response);

    const existingIds = produits.map((produit) => produit.id);
    console.log("existingIds", existingIds);

     // Step 1: Delete products not in the new produits array
    await prisma.commandesProduits.deleteMany({
      where: {
        commandeId: id, // Ensure this matches your schema for linking `commandeProduits` to `commandes`
        id: {
          notIn: existingIds, // Delete records not in the incoming produits array
        },
      },
    });

    const result = await prisma.commandes.update({
      where: { id },
      data: {
        numero,
        statut,
        sousTotal: sousTotal,
        fraisLivraison: fraisLivraison,
        reduction: reduction,
        total: total,
        typeReduction,
        avance,
        echeance,
        note,
        commandeProduits: {
          upsert: produits.map((articl) => ({
            where: {
              commandeId_produitId: {
                commandeId: id, // Ensure it's the correct order ID
                produitId: articl.id, // Ensure it's the correct product ID
              },
            },
            update: {
              quantite: parseInt(articl.quantite),
              prixUnite: parseFloat(articl.prixUnite),
              montant: parseInt(articl.quantite) * parseFloat(articl.prixUnite),
            },
            create: {
             // commandeId: id, // Needed for linking the order
              produitId: articl.id,
              quantite: parseInt(articl.quantite),
              prixUnite: parseFloat(articl.prixUnite),
              montant: parseInt(articl.quantite) * parseFloat(articl.prixUnite),
            },
          })),
        },
      },
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
