import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

// POST - Créer un versement vers compte pro
export async function POST(req) {
  try {
    const body = await req.json();
    const { montant, sourceCompteId, compteProId, reference, note } = body;

    // Validation
    if (!montant || montant <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être supérieur à 0" },
        { status: 400 }
      );
    }

    if (!compteProId) {
      return NextResponse.json(
        { error: "Le compte pro est requis" },
        { status: 400 }
      );
    }

    // Vérifier que le compte source n'est pas le compte pro (si sourceCompteId est fourni)
    if (sourceCompteId && sourceCompteId === compteProId) {
      return NextResponse.json(
        { error: "Le compte source ne peut pas être le compte professionnel" },
        { status: 400 }
      );
    }

    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Récupérer le compte source si fourni
      let sourceCompte = null;
      if (sourceCompteId) {
        sourceCompte = await tx.comptesBancaires.findUnique({
          where: { id: sourceCompteId },
        });

        if (!sourceCompte) {
          throw new Error("Compte source introuvable");
        }

        // Vérifier le solde suffisant
        if (sourceCompte.solde < montant) {
          throw new Error(
            `Solde insuffisant. Solde disponible: ${sourceCompte.solde} DH`
          );
        }
      }

      // Récupérer le compte pro
      const comptePro = await tx.comptesBancaires.findUnique({
        where: { id: compteProId },
      });

      if (!comptePro) {
        throw new Error("Compte professionnel introuvable");
      }

      // Décrémenter le solde du compte source seulement s'il existe
      if (sourceCompte) {
        await tx.comptesBancaires.update({
          where: { id: sourceCompteId },
          data: {
            solde: {
              decrement: montant,
            },
          },
        });
      }

      // Incrémenter le solde du compte pro
      await tx.comptesBancaires.update({
        where: { id: compteProId },
        data: {
          solde: {
            increment: montant,
          },
        },
      });

      // Créer le versement
      const versement = await tx.versement.create({
        data: {
          montant,
          sourceCompteId: sourceCompteId || null,
          compteProId,
          reference: reference || null,
          note: note || null,
          date: new Date(),
        },
        include: {
          sourceCompte: {
            select: {
              id: true,
              compte: true,
            },
          },
          comptePro: {
            select: {
              id: true,
              compte: true,
            },
          },
        },
      });

      return {
        versement,
        sourceCompteSolde: sourceCompte ? sourceCompte.solde - montant : null,
        compteProSolde: comptePro.solde + montant,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Versement effectué avec succès",
      data: result,
    });
  } catch (error) {
    console.error("Erreur lors de la création du versement:", error);
    return NextResponse.json(
      {
        error: error.message || "Une erreur est survenue lors du versement",
      },
      { status: 500 }
    );
  }
}

// GET - Récupérer l'historique des versements avec pagination
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Récupérer les versements avec pagination
    const [versements, total] = await Promise.all([
      prisma.versement.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          sourceCompte: {
            select: {
              id: true,
              compte: true,
              solde: true,
            },
          },
          comptePro: {
            select: {
              id: true,
              compte: true,
              solde: true,
            },
          },
          affectationsVersement: {
            select: {
              id: true,
              montant: true,
              factureId: true,
              facture: {
                select: {
                  id: true,
                  numero: true,
                  date: true,
                  total: true,
                  client: {
                    select: {
                      id: true,
                      nom: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.versement.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      versements,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des versements:", error);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la récupération des versements",
      },
      { status: 500 }
    );
  }
}

