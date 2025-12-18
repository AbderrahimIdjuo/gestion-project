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
      type,
      reference,
      statutPaiement,
      montantPaye,
      compte,
      fournisseurNom,
    } = response;
    const montant =
      statutPaiement === "paye"
        ? parseFloat(total)
        : parseFloat(montantPaye) || 0;
    const result = await prisma.$transaction(
      async prisma => {
        const bonLivraison = await prisma.bonLivraison.create({
          data: {
            date: date || new Date(),
            numero,
            total: parseFloat(total),
            reference,
            type,
            statutPaiement: statutPaiement || "impaye",
            totalPaye: montant,
            fournisseur: {
              connect: { id: fournisseurId },
            },
            groups: {
              create: bLGroups.map(group => ({
                id: group.id,
                devisNumero: group.devisNumber,
                clientName: group.clientName,
                charge: group.charge,
                produits: {
                  create: group.items.map(produit => ({
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

        // creation de la transaction
        if (statutPaiement !== "impaye") {
          await prisma.transactions.create({
            data: {
              reference: bonLivraison.id,
              type: "depense",
              montant:
                statutPaiement === "enPartie"
                  ? parseFloat(montantPaye)
                  : parseFloat(total),
              compte,
              lable: "paiement de :" + numero,
              description: "bénéficiaire :" + fournisseurNom,
              methodePaiement: "espece",
              date: date || new Date(),
            },
          });

          // Mise à jour d'un compte bancaire
          await prisma.comptesBancaires.updateMany({
            where: { compte: compte },
            data: {
              solde: { decrement: montant },
            },
          });
        }

        // Mettre à jour la dette du fournisseur
        const difference = montantPaye
          ? parseFloat(total) - parseFloat(montantPaye)
          : parseFloat(total);
        await prisma.fournisseurs.update({
          where: { id: fournisseurId },
          data: {
            dette:
              type === "achats"
                ? { increment: difference }
                : type === "retour" && { decrement: parseFloat(total) },
          },
        });

        // Mettre à jour les devis liés aux groupes de BL
        const DevisNumbers = bLGroups
          .map(g => g.devisNumber)
          .filter(num => num !== null && num !== undefined);

        if (DevisNumbers.length > 0) {
          // Récupérer les devis pour vérifier leurs statuts et dateStart
          const devisList = await prisma.devis.findMany({
            where: {
              numero: { in: DevisNumbers },
            },
            select: {
              numero: true,
              statut: true,
              dateStart: true,
            },
          });

          // Mettre à jour dateStart pour les devis qui n'ont pas de dateStart
          const devisWithoutDateStart = devisList
            .filter(d => d.dateStart === null)
            .map(d => d.numero);

          if (devisWithoutDateStart.length > 0) {
            await prisma.devis.updateMany({
              where: {
                numero: { in: devisWithoutDateStart },
              },
              data: {
                dateStart: date || new Date(),
              },
            });
          }

          // Mettre à jour le statut pour les devis qui ne sont pas "Terminer"
          const devisNotTerminer = devisList
            .filter(d => d.statut !== "Terminer")
            .map(d => d.numero);

          if (devisNotTerminer.length > 0) {
            await prisma.devis.updateMany({
              where: {
                numero: { in: devisNotTerminer },
              },
              data: {
                statut: "Accepté",
              },
            });
          }
        }
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
      date,
      fournisseurId,
      bLGroups,
      total,
      type,
      reference,
      statutPaiement,
    } = response;

    // 1. Récupérer les groups existants
    const existing = await prisma.bonLivraison.findUnique({
      where: { id },
      include: {
        groups: {
          select: { id: true },
        },
      },
    });

    const existingGroupIds = existing?.groups.map(g => g.id) || [];
    const incomingGroupIds = bLGroups.map(group => group.id);

    // 2. Supprimer les groups retirés
    const groupsToDelete = existingGroupIds.filter(
      existingId => !incomingGroupIds.includes(existingId)
    );

    await prisma.bLGroups.deleteMany({
      where: {
        id: { in: groupsToDelete },
      },
    });

    // 3. Pour chaque group, supprimer les produits retirés
    for (const group of bLGroups) {
      const existingProduits = await prisma.blGroupsProduits.findMany({
        where: { groupId: group.id },
        select: { id: true },
      });

      const existingProduitIds = existingProduits.map(p => p.id);
      const incomingProduitIds = group.items.map(p => p.id);

      const produitsToDelete = existingProduitIds.filter(
        id => !incomingProduitIds.includes(id)
      );

      if (produitsToDelete.length > 0) {
        await prisma.blGroupsProduits.deleteMany({
          where: {
            groupId: group.id,
            id: { in: produitsToDelete },
          },
        });
      }
    }

    // 4. Upsert commandeFourniture avec groupes et produits
    const result = await prisma.bonLivraison.update({
      where: { id },
      data: {
        date,
        total: parseFloat(total),
        type,
        reference,
        statutPaiement,
        fournisseur: {
          connect: { id: fournisseurId },
        },
        groups: {
          upsert: bLGroups.map(group => ({
            where: { id: group.id },
            update: {
              devisNumero: group.devisNumber,
              clientName: group.clientName,
              charge: group.charge,
              produits: {
                upsert: group.items.map(produit => ({
                  where: {
                    id: produit.id,
                  },
                  update: {
                    quantite: parseFloat(produit.quantite),
                    prixUnite: parseFloat(produit.prixUnite),
                    produit: {
                      connect: { id: produit.produitId },
                    },
                  },
                  create: {
                    quantite: parseFloat(produit.quantite),
                    prixUnite: parseFloat(produit.prixUnite),
                    produit: {
                      connect: { id: produit.produitId },
                    },
                  },
                })),
              },
            },
            create: {
              id: group.id,
              devisNumero: group.devisNumber,
              clientName: group.clientName,
              charge: group.charge,
              produits: {
                create: group.items.map(produit => ({
                  quantite: parseFloat(produit.quantite),
                  prixUnite: parseFloat(produit.prixUnite),
                  produit: {
                    connect: { id: produit.produitId },
                  },
                })),
              },
            },
          })),
        },
      },
    });

    const difference = parseFloat(total) - parseFloat(existing.total);

    let detteUpdate = {};

    if (type === "achats") {
      if (difference > 0) {
        detteUpdate = { increment: difference };
      } else if (difference < 0) {
        detteUpdate = { decrement: -difference };
      }
    } else if (type === "retour") {
      if (difference > 0) {
        detteUpdate = { decrement: difference };
      } else if (difference < 0) {
        detteUpdate = { increment: -difference };
      }
    }

    if (Object.keys(detteUpdate).length > 0) {
      await prisma.fournisseurs.update({
        where: { id: fournisseurId },
        data: {
          dette: detteUpdate,
        },
      });
    }

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
  const type = searchParams.get("type");
  const fournisseurId = searchParams.get("fournisseurId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const minTotal = searchParams.get("minTotal");
  const maxTotal = searchParams.get("maxTotal");

  const filters = {};
  const bonLivraisonPerPage = 10;

  // Search filter by produit designation , fournisseur
  filters.OR = [
    { fournisseur: { nom: { contains: searchQuery, mode: "insensitive" } } },
    { numero: { contains: searchQuery, mode: "insensitive" } },
    { reference: { contains: searchQuery, mode: "insensitive" } },
  ];

  // ✅ Filtres multi-statuts (supports multiple values separated by "-")
  if (statutPaiement && statutPaiement !== "all") {
    const statutPaiementArray = statutPaiement.split("-");
    if (statutPaiementArray.length > 0) {
      filters.statutPaiement = { in: statutPaiementArray };
    }
  }

  // ✅ Filtrer par type
  if (type && type !== "all") {
    filters.type = type;
  }

  // ✅ Filtrer par fournisseur
  if (fournisseurId) {
    filters.fournisseurId = fournisseurId;
  }

  // ✅ Filtrer par période (createdAt entre from et to)
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

  // ✅  total range filter
  if (minTotal && maxTotal) {
    filters.total = {
      gte: Number(minTotal),
      lte: Number(maxTotal),
    };
  }
  // Fetch filtered commandes with pagination and related data
  const [bonLivraison, totalBonLivraison, lastBonLivraison, maxBonLivraison] =
    await Promise.all([
      prisma.bonLivraison.findMany({
        where: filters,
        skip: (page - 1) * bonLivraisonPerPage,
        take: bonLivraisonPerPage,
        orderBy: { date: "desc" },
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
                      categorieProduits: {
                        select: {
                          categorie: true,
                        },
                      },
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
      prisma.bonLivraison.findFirst({
        orderBy: { total: "desc" },
      }),
    ]);
  // Extract BL numbers for transaction lookup
  const BlNumbers = bonLivraison.map(c => c.numero);

  // Fetch transactions for the BLs
  const transactionsList = await prisma.transactions.findMany({
    where: {
      OR: BlNumbers.map(bl => ({
        lable: { contains: bl },
      })),
    },
  });
  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalBonLivraison / bonLivraisonPerPage);
  const maxMontant = maxBonLivraison?.total;
  // Return the response
  return NextResponse.json({
    bonLivraison,
    totalPages,
    lastBonLivraison,
    maxMontant,
    transactionsList,
  });
}
