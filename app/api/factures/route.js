"use server";
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
    const { numero, devisNumero, date, total, articls, clientId, versementId, versements } = response;

    // Utiliser une transaction pour créer la facture et l'affectation si versementId ou versements existe
    const resultat = await prisma.$transaction(async (tx) => {
      // Créer la facture
      const facture = await tx.factures.create({
        data: {
          numero,
          date,
          devisNumero,
          client: {
            connect: { id: clientId },
          },
          articls: {
            create: articls.map((articl) => ({
              height: articl.height || 0,
              length: articl.length || 0,
              unite: articl.unite || "U",
              width: articl.width || 0,
              designation: articl.designation,
              quantite: articl.quantite,
              prixUnite: articl.prixUnite || 0,
            })),
          },
          total: total || 0,
        },
      });

      // Gérer les affectations de versements
      const versementsToProcess = versements || (versementId ? [{ versementId, montant: total }] : []);

      if (versementsToProcess.length > 0) {
        let totalMontantAffecte = 0;

        // Vérifier tous les versements et calculer le total
        for (const v of versementsToProcess) {
          const versement = await tx.versement.findUnique({
            where: { id: v.versementId },
            include: {
              affectationsVersement: true,
            },
          });

          if (!versement) {
            throw new Error(`Versement introuvable: ${v.versementId}`);
          }

          // Calculer le montant déjà affecté pour ce versement
          const montantDejaAffecte = versement.affectationsVersement.reduce(
            (sum, aff) => sum + aff.montant,
            0
          );
          const montantDisponible = versement.montant - montantDejaAffecte;

          // Vérifier que le montant à affecter ne dépasse pas le montant disponible
          if (v.montant > montantDisponible) {
            throw new Error(
              `Le montant à affecter (${v.montant}) dépasse le montant disponible pour le versement ${versement.reference || versement.id} (${montantDisponible} disponible)`
            );
          }

          totalMontantAffecte += v.montant;
        }

        // Vérifier que le total des affectations ne dépasse pas le montant de la facture
        if (totalMontantAffecte > total) {
          throw new Error(
            `Le total des montants affectés (${totalMontantAffecte}) dépasse le montant de la facture (${total})`
          );
        }

        // Créer toutes les affectations
        for (const v of versementsToProcess) {
          await tx.affectationVersement.create({
            data: {
              versementId: v.versementId,
              factureId: facture.id,
              montant: v.montant,
            },
          });
        }
      }

      return facture;
    });

    return NextResponse.json({
      message: "facture créée avec succès.",
      resultat,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { 
        message: error.message || "Une erreur est survenue lors de la création de la facture." 
      },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const response = await req.json();
    const { numero, id, date, total, articls, clientId } = response;
    // Fetch existing devis with articls
    const facture = await prisma.factures.findUnique({
      where: { id },
      include: { articls: true },
    });

    // If the devis is not found, return an error
    if (!facture) {
      return NextResponse.json({ message: "Devi not found" }, { status: 404 });
    }

    // Extract existing article IDs
    const existingIds = new Set(facture.articls.map((articl) => articl.id));
    const incomingIds = new Set(articls.map((articl) => articl.id));

    // Categorize articles
    const existingArticls = articls.filter((articl) =>
      existingIds.has(articl.id)
    );
    const newArticls = articls.filter((articl) => !existingIds.has(articl.id));
    const deletedArticls = facture.articls.filter(
      (articl) => !incomingIds.has(articl.id)
    );

    const result = await prisma.$transaction(async (prisma) => {
      // Delete old articls only if necessary
      if (deletedArticls.length > 0) {
        await prisma.facturesArticls.deleteMany({
          where: {
            id: { in: deletedArticls.map((p) => p.id) },
          },
        });
      }

      // Update devis and its articles
      await prisma.factures.update({
        where: { id },
        data: {
          numero,
          date,
          total,
          client: {
            connect: { id: clientId },
          },
          articls: {
            update: existingArticls.map((articl) => ({
              where: { id: articl.id },
              data: {
                height: articl.height || 0,
                length: articl.length || 0,
                width: articl.width || 0,
                unite: articl.unite,
                designation: articl.designation,
                quantite: articl.quantite,
                prixUnite: articl.prixUnite,
              },
            })),
            create: newArticls.map((articl) => ({
              height: articl.height || 0,
              length: articl.length || 0,
              width: articl.width || 0,
              unite: articl.unite,
              designation: articl.designation,
              quantite: articl.quantite,
              prixUnite: articl.prixUnite,
            })),
          },
        },
      });
    });
    return NextResponse.json({
      message: "facture recurrente créée avec succès.",
      result,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la création de la facture." },
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
  const minTotal = searchParams.get("minTotal");
  const maxTotal = searchParams.get("maxTotal");
  const filters = {};
  const facturesPerPage = 10;
  console.log("minTotal : ", minTotal, "maxTotal:", maxTotal);
  // Search filter by produit designation , fournisseur
  filters.OR = [
    { numero: { contains: searchQuery, mode: "insensitive" } },
    { devisNumero: { contains: searchQuery, mode: "insensitive" } },
    { client: { nom: { contains: searchQuery, mode: "insensitive" } } },
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

  // total range filter
  if (minTotal && maxTotal) {
    filters.total = {
      gte: Number(minTotal),
      lte: Number(maxTotal),
    };
  }

  // Fetch filtered commandes with pagination and related data
  const [factures, factureMaxMontant, totalFactures] = await Promise.all([
    prisma.factures.findMany({
      where: filters,
      skip: (page - 1) * facturesPerPage,
      take: facturesPerPage,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            ice: true,
            titre: true,
          },
        },
        articls: {
          select: {
            id: true,
            length: true,
            unite: true,
            width: true,
            designation: true,
            quantite: true,
            prixUnite: true,
            height: true,
          },
        },
      },
    }),
    prisma.factures.findFirst({
      orderBy: { total: "desc" },
    }),

    prisma.factures.count({ where: filters }),
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalFactures / facturesPerPage);

  // Return the response
  return NextResponse.json({
    factures,
    maxMontant: factureMaxMontant?.total || 0,
    totalPages,
  });
}
