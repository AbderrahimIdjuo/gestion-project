import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let page = parseInt(searchParams.get("page") || "1");
    const searchQuery = searchParams.get("query") || "";
    const compte = searchParams.get("compte") || "all";
    const statut = searchParams.get("statut") || "all";
    const methodePaiement = searchParams.get("methodePaiement") || "all";
    const statusPrelevement = searchParams.get("statusPrelevement") || "all";
    const from = searchParams.get("from"); // Start date (dateReglement)
    const to = searchParams.get("to"); // End date (dateReglement)
    const fromPrelevement = searchParams.get("fromPrelevement"); // Start date (datePrelevement)
    const toPrelevement = searchParams.get("toPrelevement"); // End date (datePrelevement)
    const minMontant = searchParams.get("minMontant");
    const maxMontant = searchParams.get("maxMontant");
    const fournisseurId = searchParams.get("fournisseurId");
    const limit = parseInt(searchParams.get("limit") || "10");
    const filters = {};

    // Search filter - recherche dans motif et description du fournisseur
    if (searchQuery) {
      filters.OR = [
        { motif: { contains: searchQuery, mode: "insensitive" } },
                // Permettre la recherche directe de montants (ex: "1000" trouve tous les règlements de 1000 DH)
                // On ajoute une clause OR pour match le champ montant si la requête searchQuery est numérique
                ...(Number.isFinite(Number(searchQuery)) && searchQuery.trim() !== ""
                  ? [
                      {
                        montant: Number(searchQuery),
                      },
                    ]
                  : []),
                {
          cheque : {
            numero: { contains: searchQuery, mode: "insensitive" },
          },
        },
        {
          fournisseur: {
            nom: { contains: searchQuery, mode: "insensitive" },
          },
        },
      ];
    }

    // Compte filter (peut être multiple, séparé par des virgules)
    if (compte && compte !== "all") {
      const compteArray = compte.split(",").map(c => c.trim());
      if (compteArray.length === 1) {
        filters.compte = compteArray[0];
      } else {
        filters.compte = {
          in: compteArray,
        };
      }
    }

    // Statut filter
    if (statut !== "all") {
      filters.statut = statut;
    }

    // Méthode de paiement filter (peut être multiple, séparé par des virgules)
    if (methodePaiement && methodePaiement !== "all") {
      const methodePaiementArray = methodePaiement.split(",").map(m => m.trim());
      if (methodePaiementArray.length === 1) {
        filters.methodePaiement = methodePaiementArray[0];
      } else {
        filters.methodePaiement = {
          in: methodePaiementArray,
        };
      }
    }

    // Statut de prélèvement filter (peut être multiple, séparé par des virgules)
    // "annule" inclut aussi les anciennes valeurs "echoue" et "refuse" pour rétrocompatibilité
    if (statusPrelevement && statusPrelevement !== "all") {
      let statusArray = statusPrelevement.split(",").map(s => s.trim());
      if (statusArray.includes("annule")) {
        statusArray = [...new Set([...statusArray, "annule", "echoue", "refuse"])];
      }
      if (statusArray.length === 1) {
        // Un seul statut
        const singleStatus = statusArray[0];
        if (singleStatus === "en_retard") {
          // "en_retard" est un état calculé : datePrelevement < today ET statusPrelevement = "en_attente"
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          filters.statusPrelevement = "en_attente";
          filters.datePrelevement = {
            not: null,
            lt: today,
          };
        } else if (singleStatus === "annule") {
          // "annule" inclut les anciennes valeurs echoue et refuse
          filters.statusPrelevement = { in: ["annule", "echoue", "refuse"] };
        } else {
          filters.statusPrelevement = singleStatus;
          // Si on filtre par "en_attente", exclure les règlements sans date de prélèvement
          if (singleStatus === "en_attente") {
            filters.datePrelevement = {
              not: null,
            };
          }
        }
      } else {
        // Plusieurs statuts
        // Vérifier si "en_retard" est dans la liste
        const hasEnRetard = statusArray.includes("en_retard");
        const statusWithoutEnRetard = statusArray.filter(s => s !== "en_retard");
        
        const orConditions = [];
        
        // Ajouter la condition pour "en_retard" si présent
        if (hasEnRetard) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          orConditions.push({
            statusPrelevement: "en_attente",
            datePrelevement: {
              not: null,
              lt: today,
            },
          });
        }
        
        // Ajouter les autres statuts
        if (statusWithoutEnRetard.length > 0) {
          const hasEnAttente = statusWithoutEnRetard.includes("en_attente");
          const otherStatuses = statusWithoutEnRetard.filter(s => s !== "en_attente");
          
          if (hasEnAttente && otherStatuses.length > 0) {
            // Cas mixte : en_attente + autres statuts
            orConditions.push({
              statusPrelevement: "en_attente",
              datePrelevement: { not: null },
            });
            orConditions.push({
              statusPrelevement: { in: otherStatuses },
            });
          } else if (hasEnAttente) {
            // Seulement en_attente
            orConditions.push({
              statusPrelevement: "en_attente",
              datePrelevement: { not: null },
            });
          } else {
            // Autres statuts seulement
            orConditions.push({
              statusPrelevement: { in: statusWithoutEnRetard },
            });
          }
        }
        
        // Combiner avec filters.OR existant pour la recherche si présent
        if (orConditions.length > 0) {
          if (filters.OR && Array.isArray(filters.OR)) {
            // Si filters.OR existe déjà (pour la recherche), on doit combiner avec AND
            // On crée une structure AND qui combine la recherche OR et les statuts OR
            const searchOR = filters.OR;
            delete filters.OR;
            filters.AND = [
              { OR: searchOR },
              { OR: orConditions },
            ];
          } else {
            // Pas de conflit, on peut utiliser OR directement
            if (orConditions.length === 1) {
              Object.assign(filters, orConditions[0]);
            } else {
              filters.OR = orConditions;
            }
          }
        }
      }
    }

    // Date range filter (sur dateReglement)
    if (from && to) {
      const startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);

      filters.dateReglement = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Date range filter (sur datePrelevement)
    // Note: Si statusPrelevement contient "en_retard", on a peut-être déjà défini datePrelevement
    if (fromPrelevement && toPrelevement) {
      const startDatePrelevement = new Date(fromPrelevement);
      startDatePrelevement.setHours(0, 0, 0, 0);

      const endDatePrelevement = new Date(toPrelevement);
      endDatePrelevement.setHours(23, 59, 59, 999);

      // Si on a déjà un filtre datePrelevement (pour en_retard), on doit combiner
      const statusArray = statusPrelevement && statusPrelevement !== "all" 
        ? statusPrelevement.split(",").map(s => s.trim())
        : [];
      const hasEnRetard = statusArray.includes("en_retard");
      
      if (filters.datePrelevement && hasEnRetard) {
        // Combiner les filtres : datePrelevement < today ET dans la plage sélectionnée
        filters.datePrelevement = {
          ...filters.datePrelevement,
          gte: startDatePrelevement,
          lte: endDatePrelevement,
        };
      } else {
        filters.datePrelevement = {
          gte: startDatePrelevement,
          lte: endDatePrelevement,
        };
      }
    }

    // Montant filter
    if (minMontant || maxMontant) {
      filters.montant = {};
      if (minMontant) {
        filters.montant.gte = parseFloat(minMontant);
      }
      if (maxMontant) {
        filters.montant.lte = parseFloat(maxMontant);
      }
    }

    // Fournisseur filter
    if (fournisseurId) {
      filters.fournisseurId = fournisseurId;
    }

    const skip = (page - 1) * limit;
    const reglementsPerPage = limit;

    // Fetch filtered reglements with pagination
    const reglements = await prisma.reglement.findMany({
      where: filters,
      skip: skip,
      take: limit,
      orderBy: { dateReglement: "desc" },
      include: {
        fournisseur: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
            adresse: true,
            ice: true,
          },
        },
        cheque: {
          select: {
            id: true,
            numero: true,
            dateReglement: true,
            datePrelevement: true,
          },
        },
        factureAchats: {
          select: {
            id: true,
            numero: true,
          },
        },
      },
    });

    const totalReglements = await prisma.reglement.count({ where: filters });
    const totalPages = Math.ceil(totalReglements / reglementsPerPage);

    return NextResponse.json({
      reglements,
      totalPages,
      totalReglements,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des règlements:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des règlements" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, statut, statusPrelevement } = body;

    if (!id) {
      return NextResponse.json({ error: "ID est requis" }, { status: 400 });
    }

    // Si statusPrelevement est fourni, mettre à jour statusPrelevement
    if (statusPrelevement !== undefined) {
      // Vérifier que le statusPrelevement est valide
      const statusPrelevementsValides = [
        "en_attente",
        "confirme",
        "annule",
        "reporte",
      ];
      if (!statusPrelevementsValides.includes(statusPrelevement)) {
        return NextResponse.json(
          { error: "Statut de prélèvement invalide" },
          { status: 400 }
        );
      }

      // Utiliser une transaction pour garantir la cohérence
      const result = await prisma.$transaction(async tx => {
        // Récupérer le règlement existant avec ses allocations BL pour pouvoir mettre à jour les BL en cas d'annulation
        const reglementExistant = await tx.reglement.findUnique({
          where: { id },
          include: { blAllocations: { orderBy: { id: "asc" } } },
        });

        if (!reglementExistant) {
          throw new Error("Règlement non trouvé");
        }

        // Vérifier que le règlement a une date de prélèvement
        if (!reglementExistant.datePrelevement) {
          throw new Error(
            "Impossible de changer le statut : le règlement n'a pas de date de prélèvement"
          );
        }

        const ancienStatusPrelevement = reglementExistant.statusPrelevement;
        const nouveauStatusPrelevement = statusPrelevement;

        // Gestion de la mise à jour du solde du compte bancaire et des transactions selon le changement de statut
        // Cas 1: Passage à "confirme" (déduction du montant du compte + création de transaction)
        if (
          nouveauStatusPrelevement === "confirme" &&
          ancienStatusPrelevement !== "confirme"
        ) {
          // Déduire le montant du compte bancaire car le prélèvement est confirmé
          await tx.comptesBancaires.updateMany({
            where: { compte: reglementExistant.compte },
            data: {
              solde: { decrement: reglementExistant.montant },
            },
          });
          const fournisseur = await tx.fournisseurs.findUnique({
            where: { id: reglementExistant.fournisseurId },
            select: { nom: true },
          });
          // Créer une transaction pour enregistrer le prélèvement confirmé
          await tx.transactions.create({
            data: {
              ReglementId: reglementExistant.id,
              reference: reglementExistant.id,
              type: "depense",
              montant: reglementExistant.montant,
              compte: reglementExistant.compte,
              fournisseurId: reglementExistant.fournisseurId,
              lable: "paiement fournisseur",
              description: "bénéficiaire :" + fournisseur.nom,
              methodePaiement: reglementExistant.methodePaiement,
              date: new Date(),
              motif: reglementExistant.motif || null,
              cheque: reglementExistant.chequeId
                ? {
                    connect: {
                      id: reglementExistant.chequeId,
                    },
                  }
                : undefined,
            },
          });
        }
        // Cas 2: Passage de "confirme" à un autre statut : remboursement compte + suppression transaction
        if (
          ancienStatusPrelevement === "confirme" &&
          nouveauStatusPrelevement !== "confirme"
        ) {
          await tx.comptesBancaires.updateMany({
            where: { compte: reglementExistant.compte },
            data: {
              solde: { increment: reglementExistant.montant },
            },
          });
          await tx.transactions.deleteMany({
            where: {
              OR: [
                { ReglementId: reglementExistant.id },
                { reference: reglementExistant.id, type: "depense" },
              ],
            },
          });
        }

        // Cas 3: Passage à "annulé" (quel que soit l'ancien statut) : inverser l'effet de création du règlement = annuler le paiement des BL et supprimer les allocations
        if (
          nouveauStatusPrelevement === "annule" &&
          ancienStatusPrelevement !== "annule"
        ) {
          if (reglementExistant.blAllocations && reglementExistant.blAllocations.length > 0) {
            for (const alloc of reglementExistant.blAllocations) {
              const bl = await tx.bonLivraison.findUnique({
                where: { id: alloc.bonLivraisonId },
              });
              if (bl) {
                const nouveauTotalPaye = Math.max(
                  0,
                  (bl.totalPaye ?? 0) - alloc.montant
                );
                let nouveauStatutPaiement = "impaye";
                if (nouveauTotalPaye > 0 && nouveauTotalPaye < bl.total) {
                  nouveauStatutPaiement = "enPartie";
                } else if (nouveauTotalPaye >= bl.total) {
                  nouveauStatutPaiement = "paye";
                }
                await tx.bonLivraison.update({
                  where: { id: alloc.bonLivraisonId },
                  data: {
                    totalPaye: nouveauTotalPaye,
                    statutPaiement: nouveauStatutPaiement,
                  },
                });
              }
            }
            await tx.reglementBlAllocation.deleteMany({ where: { reglementId: id } });
          } else if (reglementExistant.reference) {
            const bonLivraison = await tx.bonLivraison.findUnique({
              where: { id: reglementExistant.reference },
            });
            if (bonLivraison) {
              const nouveauTotalPaye = Math.max(
                0,
                (bonLivraison.totalPaye ?? 0) - reglementExistant.montant
              );
              let nouveauStatutPaiement = bonLivraison.statutPaiement;
              if (nouveauTotalPaye <= 0) {
                nouveauStatutPaiement = "impaye";
              } else if (nouveauTotalPaye < bonLivraison.total) {
                nouveauStatutPaiement = "enPartie";
              } else if (nouveauTotalPaye >= bonLivraison.total) {
                nouveauStatutPaiement = "paye";
              }
              await tx.bonLivraison.update({
                where: { id: reglementExistant.reference },
                data: {
                  totalPaye: nouveauTotalPaye,
                  statutPaiement: nouveauStatutPaiement,
                },
              });
            }
          }
        }

        // Cas 4: Passage de "annulé" à un autre statut : repayer les BL associés à ce fournisseur (les plus anciens d'abord)
        if (
          ancienStatusPrelevement === "annule" &&
          nouveauStatusPrelevement !== "annule"
        ) {
          if (reglementExistant.blAllocations && reglementExistant.blAllocations.length > 0) {
            for (const alloc of reglementExistant.blAllocations) {
              const bl = await tx.bonLivraison.findUnique({
                where: { id: alloc.bonLivraisonId },
              });
              if (bl) {
                const nouveauTotalPaye = (bl.totalPaye ?? 0) + alloc.montant;
                let nouveauStatutPaiement = "enPartie";
                if (nouveauTotalPaye >= bl.total) {
                  nouveauStatutPaiement = "paye";
                }
                await tx.bonLivraison.update({
                  where: { id: alloc.bonLivraisonId },
                  data: {
                    totalPaye: nouveauTotalPaye,
                    statutPaiement: nouveauStatutPaiement,
                  },
                });
              }
            }
          } else if (reglementExistant.reference) {
            const bonLivraison = await tx.bonLivraison.findUnique({
              where: { id: reglementExistant.reference },
            });
            if (bonLivraison) {
              const nouveauTotalPaye = (bonLivraison.totalPaye ?? 0) + reglementExistant.montant;
              let nouveauStatutPaiement = "enPartie";
              if (nouveauTotalPaye >= bonLivraison.total) {
                nouveauStatutPaiement = "paye";
              }
              await tx.bonLivraison.update({
                where: { id: reglementExistant.reference },
                data: {
                  totalPaye: nouveauTotalPaye,
                  statutPaiement: nouveauStatutPaiement,
                },
              });
            }
          } else {
            // Pas d'allocations existantes : payer les BL du fournisseur en commençant par les plus anciens
            const bonLivraisonList = await tx.bonLivraison.findMany({
              where: {
                fournisseurId: reglementExistant.fournisseurId,
                statutPaiement: { in: ["impaye", "enPartie"] },
                type: "achats",
              },
              orderBy: { date: "asc" },
            });
            let montantRestant = reglementExistant.montant;
            for (const bl of bonLivraisonList) {
              if (montantRestant <= 0) break;
              const totalPayeActuel = bl.totalPaye ?? 0;
              const resteAPayer = bl.total - totalPayeActuel;
              let montantAlloue = 0;
              if (montantRestant >= resteAPayer) {
                montantAlloue = resteAPayer;
                montantRestant -= resteAPayer;
                await tx.bonLivraison.update({
                  where: { id: bl.id },
                  data: { totalPaye: bl.total, statutPaiement: "paye" },
                });
              } else {
                montantAlloue = montantRestant;
                montantRestant = 0;
                await tx.bonLivraison.update({
                  where: { id: bl.id },
                  data: {
                    totalPaye: { increment: montantAlloue },
                    statutPaiement: "enPartie",
                  },
                });
              }
              if (montantAlloue > 0) {
                await tx.reglementBlAllocation.create({
                  data: {
                    reglementId: reglementExistant.id,
                    bonLivraisonId: bl.id,
                    montant: montantAlloue,
                  },
                });
              }
            }
          }
        }

        // Mettre à jour le statusPrelevement du règlement
        const reglement = await tx.reglement.update({
          where: { id },
          data: { statusPrelevement },
        });

        return reglement;
      });

      return NextResponse.json({
        reglement: result,
        message: "Statut de prélèvement mis à jour avec succès",
      });
    }

    // Sinon, si statut est fourni, mettre à jour statut (pour rétrocompatibilité)
    if (statut !== undefined) {
      // Vérifier que le statut est valide
      const statutsValides = ["en_attente", "paye", "en_retard", "annule"];
      if (!statutsValides.includes(statut)) {
        return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
      }

      const reglementExistant = await prisma.reglement.findUnique({
        where: { id },
        include: { blAllocations: { orderBy: { id: "asc" } } },
      });
      if (!reglementExistant) {
        return NextResponse.json({ error: "Règlement non trouvé" }, { status: 404 });
      }

      // Si passage à "annule", inverser l'effet sur les BL (annuler le paiement des BL) et supprimer les allocations
      if (statut === "annule" && reglementExistant.statut !== "annule") {
        await prisma.$transaction(async tx => {
          if (reglementExistant.blAllocations && reglementExistant.blAllocations.length > 0) {
            for (const alloc of reglementExistant.blAllocations) {
              const bl = await tx.bonLivraison.findUnique({
                where: { id: alloc.bonLivraisonId },
              });
              if (bl) {
                const nouveauTotalPaye = Math.max(0, (bl.totalPaye ?? 0) - alloc.montant);
                let nouveauStatutPaiement = "impaye";
                if (nouveauTotalPaye > 0 && nouveauTotalPaye < bl.total) nouveauStatutPaiement = "enPartie";
                else if (nouveauTotalPaye >= bl.total) nouveauStatutPaiement = "paye";
                await tx.bonLivraison.update({
                  where: { id: alloc.bonLivraisonId },
                  data: { totalPaye: nouveauTotalPaye, statutPaiement: nouveauStatutPaiement },
                });
              }
            }
            await tx.reglementBlAllocation.deleteMany({ where: { reglementId: id } });
          } else if (reglementExistant.reference) {
            const bonLivraison = await tx.bonLivraison.findUnique({
              where: { id: reglementExistant.reference },
            });
            if (bonLivraison) {
              const nouveauTotalPaye = Math.max(0, (bonLivraison.totalPaye ?? 0) - reglementExistant.montant);
              let nouveauStatutPaiement = "impaye";
              if (nouveauTotalPaye > 0 && nouveauTotalPaye < bonLivraison.total) nouveauStatutPaiement = "enPartie";
              else if (nouveauTotalPaye >= bonLivraison.total) nouveauStatutPaiement = "paye";
              await tx.bonLivraison.update({
                where: { id: reglementExistant.reference },
                data: { totalPaye: nouveauTotalPaye, statutPaiement: nouveauStatutPaiement },
              });
            }
          }
        });
      }

      // Si passage de "annule" à un autre statut : repayer les BL du fournisseur (les plus anciens d'abord)
      if (reglementExistant.statut === "annule" && statut !== "annule") {
        await prisma.$transaction(async tx => {
          if (reglementExistant.blAllocations && reglementExistant.blAllocations.length > 0) {
            for (const alloc of reglementExistant.blAllocations) {
              const bl = await tx.bonLivraison.findUnique({
                where: { id: alloc.bonLivraisonId },
              });
              if (bl) {
                const nouveauTotalPaye = (bl.totalPaye ?? 0) + alloc.montant;
                let nouveauStatutPaiement = "enPartie";
                if (nouveauTotalPaye >= bl.total) nouveauStatutPaiement = "paye";
                await tx.bonLivraison.update({
                  where: { id: alloc.bonLivraisonId },
                  data: { totalPaye: nouveauTotalPaye, statutPaiement: nouveauStatutPaiement },
                });
              }
            }
          } else if (reglementExistant.reference) {
            const bonLivraison = await tx.bonLivraison.findUnique({
              where: { id: reglementExistant.reference },
            });
            if (bonLivraison) {
              const nouveauTotalPaye = (bonLivraison.totalPaye ?? 0) + reglementExistant.montant;
              let nouveauStatutPaiement = "enPartie";
              if (nouveauTotalPaye >= bonLivraison.total) nouveauStatutPaiement = "paye";
              await tx.bonLivraison.update({
                where: { id: reglementExistant.reference },
                data: { totalPaye: nouveauTotalPaye, statutPaiement: nouveauStatutPaiement },
              });
            }
          } else {
            const bonLivraisonList = await tx.bonLivraison.findMany({
              where: {
                fournisseurId: reglementExistant.fournisseurId,
                statutPaiement: { in: ["impaye", "enPartie"] },
                type: "achats",
              },
              orderBy: { date: "asc" },
            });
            let montantRestant = reglementExistant.montant;
            for (const bl of bonLivraisonList) {
              if (montantRestant <= 0) break;
              const resteAPayer = bl.total - (bl.totalPaye ?? 0);
              let montantAlloue = 0;
              if (montantRestant >= resteAPayer) {
                montantAlloue = resteAPayer;
                montantRestant -= resteAPayer;
                await tx.bonLivraison.update({
                  where: { id: bl.id },
                  data: { totalPaye: bl.total, statutPaiement: "paye" },
                });
              } else {
                montantAlloue = montantRestant;
                montantRestant = 0;
                await tx.bonLivraison.update({
                  where: { id: bl.id },
                  data: {
                    totalPaye: { increment: montantAlloue },
                    statutPaiement: "enPartie",
                  },
                });
              }
              if (montantAlloue > 0) {
                await tx.reglementBlAllocation.create({
                  data: {
                    reglementId: reglementExistant.id,
                    bonLivraisonId: bl.id,
                    montant: montantAlloue,
                  },
                });
              }
            }
          }
        });
      }

      const reglement = await prisma.reglement.update({
        where: { id },
        data: { statut },
      });

      return NextResponse.json({
        reglement,
        message: "Statut mis à jour avec succès",
      });
    }

    return NextResponse.json(
      { error: "statut ou statusPrelevement est requis" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    if (error?.message?.includes("Access denied")) {
      return NextResponse.json(
        { error: "Accès refusé. Rôle admin requis." },
        { status: 403 }
      );
    }
    if (error?.message?.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await requireAdmin();
    const body = await req.json();
    const {
      id,
      montant,
      compte,
      methodePaiement,
      dateReglement,
      datePrelevement,
      motif,
      numeroCheque,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID du règlement requis" },
        { status: 400 }
      );
    }

    // Récupérer le règlement existant
    const reglementExistant = await prisma.reglement.findUnique({
      where: { id },
      include: { cheque: true, fournisseur: true },
    });

    if (!reglementExistant) {
      return NextResponse.json(
        { error: "Règlement non trouvé" },
        { status: 404 }
      );
    }

    const ancienMontantReglement = reglementExistant.montant;
    const nouveauMontantReglement = Number(montant) || reglementExistant.montant;

    // Utiliser une transaction Prisma pour garantir la cohérence
    const result = await prisma.$transaction(async tx => {
      // Gérer le chèque si la méthode de paiement est chèque
      let chequeId = reglementExistant.chequeId;

      if (methodePaiement === "cheque" || methodePaiement === "traite") {
        if (reglementExistant.cheque) {
          // Mettre à jour le chèque existant
          await tx.cheques.update({
            where: { id: reglementExistant.cheque.id },
            data: {
              numero: numeroCheque || reglementExistant.cheque.numero,
              montant: montant || reglementExistant.montant,
              compte: compte || reglementExistant.compte,
              dateReglement: dateReglement
                ? new Date(dateReglement)
                : reglementExistant.dateReglement,
              datePrelevement: datePrelevement
                ? new Date(datePrelevement)
                : reglementExistant.cheque.datePrelevement,
            },
          });
        } else {
          // Créer un nouveau chèque
          const nouveauCheque = await tx.cheques.create({
            data: {
              type: "EMIS",
              montant: montant || reglementExistant.montant,
              compte: compte || reglementExistant.compte,
              numero: numeroCheque,
              fournisseurId: reglementExistant.fournisseurId,
              dateReglement: dateReglement
                ? new Date(dateReglement)
                : reglementExistant.dateReglement,
              datePrelevement: datePrelevement
                ? new Date(datePrelevement)
                : null,
            },
          });
          chequeId = nouveauCheque.id;
        }
      } else {
        // Si on change de chèque à autre chose, supprimer le chèque
        if (reglementExistant.chequeId) {
          await tx.cheques.delete({
            where: { id: reglementExistant.chequeId },
          });
          chequeId = null;
        }
      }

      // Mettre à jour le compte bancaire si le montant ou le compte change
      if (
        montant !== reglementExistant.montant ||
        compte !== reglementExistant.compte
      ) {
        // Remettre l'ancien montant dans l'ancien compte
        await tx.comptesBancaires.updateMany({
          where: { compte: reglementExistant.compte },
          data: {
            solde: { increment: reglementExistant.montant },
          },
        });

        // Déduire le nouveau montant du nouveau compte
        const nouveauCompte = compte || reglementExistant.compte;
        const nouveauMontant = montant || reglementExistant.montant;
        await tx.comptesBancaires.updateMany({
          where: { compte: nouveauCompte },
          data: {
            solde: { decrement: nouveauMontant },
          },
        });
      }

      // Mettre à jour le règlement (numero = numéro de chèque ou numéro de versement)
      const nouveauNumero =
        methodePaiement === "cheque" || methodePaiement === "traite"
          ? numeroCheque ?? reglementExistant.cheque?.numero ?? reglementExistant.numero ?? null
          : methodePaiement === "versement"
            ? numeroCheque ?? reglementExistant.numero ?? null
            : reglementExistant.numero ?? null;

      const reglement = await tx.reglement.update({
        where: { id },
        data: {
          montant: montant || reglementExistant.montant,
          compte: compte || reglementExistant.compte,
          methodePaiement: methodePaiement || reglementExistant.methodePaiement,
          dateReglement: dateReglement
            ? new Date(dateReglement)
            : reglementExistant.dateReglement,
          datePrelevement: datePrelevement || reglementExistant.datePrelevement,
          motif: motif !== undefined ? motif : reglementExistant.motif,
          numero: nouveauNumero,
          chequeId: chequeId,
        },
        include: {
          fournisseur: {
            select: {
              id: true,
              nom: true,
              email: true,
              telephone: true,
              adresse: true,
              ice: true,
            },
          },
          cheque: {
            select: {
              id: true,
              numero: true,
              dateReglement: true,
              datePrelevement: true,
            },
          },
        },
      });

      // Mettre à jour la transaction associée si elle existe (si le statut est "confirme")
      if (reglementExistant.statusPrelevement === "confirme") {
        // Calculer les nouvelles valeurs
        const nouveauMontant = montant || reglementExistant.montant;
        const nouveauCompte = compte || reglementExistant.compte;
        const nouvelleDateReglement = dateReglement
          ? new Date(dateReglement)
          : reglementExistant.dateReglement;
        const nouvelleDatePrelevement = datePrelevement
          ? new Date(datePrelevement)
          : reglementExistant.datePrelevement;
        const nouveauMotif =
          motif !== undefined ? motif : reglementExistant.motif;

        // Chercher la transaction associée au règlement par ReglementId ou reference
        const transactionExistante = await tx.transactions.findFirst({
          where: {
            OR: [{ ReglementId: id }, { reference: id }],
            type: "depense",
          },
        });

        if (transactionExistante) {
          // Mettre à jour la transaction existante
          await tx.transactions.update({
            where: { id: transactionExistante.id },
            data: {
              montant: nouveauMontant,
              compte: nouveauCompte,
              date:
                nouvelleDatePrelevement || nouvelleDateReglement || new Date(),
              datePrelevement: nouvelleDatePrelevement || null,
              motif: nouveauMotif || null,
              description: "bénéficiaire :" + reglementExistant.fournisseur.nom,
              cheque: chequeId
                ? {
                    connect: { id: chequeId },
                  }
                : transactionExistante.chequeId
                ? {
                    disconnect: true,
                  }
                : undefined,
            },
          });
        } else {
          // Si la transaction n'existe pas, la créer
          await tx.transactions.create({
            data: {
              ReglementId: id,
              reference: id,
              type: "depense",
              montant: nouveauMontant,
              compte: nouveauCompte,
              fournisseurId: reglementExistant.fournisseurId,
              lable: "paiement fournisseur",
              description: "bénéficiaire :" + reglementExistant.fournisseur.nom,
              methodePaiement: reglementExistant.methodePaiement,
              date:
                nouvelleDatePrelevement || nouvelleDateReglement || new Date(),
              datePrelevement: nouvelleDatePrelevement || null,
              motif: nouveauMotif || null,
              cheque: chequeId
                ? {
                    connect: { id: chequeId },
                  }
                : undefined,
            },
          });
        }
      }

      // Si le règlement a une référence (BL), mettre à jour le BL
      if (reglementExistant.reference) {
        // Récupérer le BL pour connaître son total et totalPaye actuel
        const bonLivraison = await tx.bonLivraison.findUnique({
          where: { id: reglementExistant.reference },
        });

        if (bonLivraison) {
          // Mettre à jour le montant payé (ajouter ou soustraire la différence)
          const nouveauTotalPaye = Math.max(
            0,
            (bonLivraison.totalPaye ?? 0) + (nouveauMontantReglement - ancienMontantReglement)
          );

          // Calculer le nouveau statut de paiement
          let nouveauStatutPaiement = bonLivraison.statutPaiement;
          if (nouveauTotalPaye <= 0) {
            nouveauStatutPaiement = "impaye";
          } else if (nouveauTotalPaye < bonLivraison.total) {
            nouveauStatutPaiement = "enPartie";
          } else if (nouveauTotalPaye >= bonLivraison.total) {
            nouveauStatutPaiement = "paye";
          }

          // Mettre à jour le BL
          await tx.bonLivraison.update({
            where: { id: reglementExistant.reference },
            data: {
              totalPaye: nouveauTotalPaye,
              statutPaiement: nouveauStatutPaiement,
            },
          });
        }
      }

      // Ajuster la dette fournisseur : ancien règlement diminuait la dette de ancienMontantReglement, le nouveau de nouveauMontantReglement
      const deltaDette = ancienMontantReglement - nouveauMontantReglement;
      if (deltaDette !== 0) {
        await tx.fournisseurs.update({
          where: { id: reglementExistant.fournisseurId },
          data:
            deltaDette > 0
              ? { dette: { increment: deltaDette } }
              : { dette: { decrement: -deltaDette } },
        });
      }

      return {
        success: true,
        message: "Règlement mis à jour avec succès",
        reglement,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du règlement:", error);
    if (error?.message?.includes("Access denied")) {
      return NextResponse.json(
        { error: "Accès refusé. Rôle admin requis." },
        { status: 403 }
      );
    }
    if (error?.message?.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du règlement" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID du règlement requis" },
        { status: 400 }
      );
    }

    // Utiliser une transaction Prisma pour garantir la cohérence des données
    const result = await prisma.$transaction(async tx => {
      // Récupérer le règlement avec ses relations et allocations BL
      const reglement = await tx.reglement.findUnique({
        where: { id },
        include: {
          cheque: true,
          blAllocations: { orderBy: { id: "asc" } },
        },
      });

      if (!reglement) {
        throw new Error("Règlement non trouvé");
      }

      // Remettre l'argent dans le compte bancaire
      await tx.comptesBancaires.updateMany({
        where: { compte: reglement.compte },
        data: {
          solde: { increment: reglement.montant },
        },
      });

      // Supprimer les transactions associées au règlement (ReglementId, ou reference / chequeId pour rétrocompatibilité)
      await tx.transactions.deleteMany({
        where: {
          OR: [
            { ReglementId: id },
            { reference: id },
            ...(reglement.chequeId ? [{ chequeId: reglement.chequeId }] : []),
          ],
        },
      });

      // Inverser l'effet sur les BL : soit via les allocations (règlement ayant payé plusieurs BL), soit via reference (un seul BL)
      if (reglement.blAllocations && reglement.blAllocations.length > 0) {
        // Règlement ayant payé plusieurs BL (les plus anciens d'abord) : on retire chaque allocation dans l'ordre inverse
        for (const alloc of reglement.blAllocations) {
          const bl = await tx.bonLivraison.findUnique({
            where: { id: alloc.bonLivraisonId },
          });
          if (bl) {
            const nouveauTotalPaye = Math.max(
              0,
              (bl.totalPaye ?? 0) - alloc.montant
            );
            let nouveauStatutPaiement = "impaye";
            if (nouveauTotalPaye > 0 && nouveauTotalPaye < bl.total) {
              nouveauStatutPaiement = "enPartie";
            } else if (nouveauTotalPaye >= bl.total) {
              nouveauStatutPaiement = "paye";
            }
            await tx.bonLivraison.update({
              where: { id: alloc.bonLivraisonId },
              data: {
                totalPaye: nouveauTotalPaye,
                statutPaiement: nouveauStatutPaiement,
              },
            });
          }
        }
        await tx.reglementBlAllocation.deleteMany({
          where: { reglementId: id },
        });
      } else if (reglement.reference) {
        // Ancien cas : règlement lié à un seul BL via reference
        const bonLivraison = await tx.bonLivraison.findUnique({
          where: { id: reglement.reference },
        });

        if (bonLivraison) {
          const nouveauTotalPaye = Math.max(
            0,
            (bonLivraison.totalPaye ?? 0) - reglement.montant
          );
          let nouveauStatutPaiement = bonLivraison.statutPaiement;
          if (nouveauTotalPaye <= 0) {
            nouveauStatutPaiement = "impaye";
          } else if (nouveauTotalPaye < bonLivraison.total) {
            nouveauStatutPaiement = "enPartie";
          } else if (nouveauTotalPaye >= bonLivraison.total) {
            nouveauStatutPaiement = "paye";
          }
          await tx.bonLivraison.update({
            where: { id: reglement.reference },
            data: {
              totalPaye: nouveauTotalPaye,
              statutPaiement: nouveauStatutPaiement,
            },
          });
        }
      }

      // Augmenter la dette du fournisseur (annuler l'effet du règlement supprimé)
      await tx.fournisseurs.update({
        where: { id: reglement.fournisseurId },
        data: { dette: { increment: reglement.montant } },
      });

      // Supprimer le règlement (cascade supprime blAllocations et le chèque)
      await tx.reglement.delete({
        where: { id },
      });

      return {
        success: true,
        message: "Règlement supprimé avec succès",
        reglement,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de la suppression du règlement:", error);

    if (error?.message?.includes("Access denied")) {
      return NextResponse.json(
        { error: "Accès refusé. Rôle admin requis." },
        { status: 403 }
      );
    }

    if (error?.message?.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    if (error.message === "Règlement non trouvé") {
      return NextResponse.json(
        { error: "Règlement non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la suppression du règlement" },
      { status: 500 }
    );
  }
}
