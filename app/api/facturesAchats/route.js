"use server";
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
    const { numero, date, total, fournisseurId, reglementId } = response;

    const resultat = await prisma.$transaction(async tx => {
      // Créer la facture
      const facture = await tx.FacturesAchats.create({
        data: {
          numero,
          date: date ? new Date(date) : new Date(),
          total: total || 0,
          fournisseur: {
            connect: { id: fournisseurId },
          },
        },
        include: {
          fournisseur: true,
        },
      });

      // Si un reglementId est fourni, lier la facture au règlement
      if (reglementId) {
        await tx.reglement.update({
          where: { id: reglementId },
          data: {
            factureAchatsId: facture.id,
          },
        });
      }

      return facture;
    });

    return NextResponse.json({
      message: "Facture créée avec succès.",
      resultat,
    });
  } catch (error) {
    console.error("Error creating facture:", error);
    return NextResponse.json(
      {
        message: "Une erreur est survenue lors de la création de la facture.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let page = parseInt(searchParams.get("page") || "1");
    const searchQuery = searchParams.get("query") || "";
    const fournisseurId = searchParams.get("fournisseurId");
    const from = searchParams.get("from"); // Start date
    const to = searchParams.get("to"); // End date
    const limit = parseInt(searchParams.get("limit") || "10");

    const filters = {};

    // Search filter - recherche dans numero et nom du fournisseur
    if (searchQuery) {
      filters.OR = [
        { numero: { contains: searchQuery, mode: "insensitive" } },
        {
          fournisseur: {
            nom: { contains: searchQuery, mode: "insensitive" },
          },
        },
      ];
    }

    // Date range filter
    if (from && to) {
      const startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);

      filters.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Fournisseur filter
    if (fournisseurId) {
      filters.fournisseurId = fournisseurId;
    }

    const skip = (page - 1) * limit;

    const factures = await prisma.FacturesAchats.findMany({
      where: filters,
      skip: skip,
      take: limit,
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
        reglements: {
          select: {
            id: true,
            montant: true,
            dateReglement: true,
            statut: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalFactures = await prisma.FacturesAchats.count({ where: filters });
    const totalPages = Math.ceil(totalFactures / limit);

    return NextResponse.json({
      factures,
      totalPages,
      totalFactures,
    });
  } catch (error) {
    console.error("Error fetching factures:", error);
    return NextResponse.json(
      {
        message:
          "Une erreur est survenue lors de la récupération des factures.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
