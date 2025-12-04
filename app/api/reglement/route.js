import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let page = parseInt(searchParams.get("page") || "1");
    const searchQuery = searchParams.get("query") || "";
    const compte = searchParams.get("compte") || "all";
    const statut = searchParams.get("statut") || "all";
    const methodePaiement = searchParams.get("methodePaiement") || "all";
    const from = searchParams.get("from"); // Start date
    const to = searchParams.get("to"); // End date
    const fournisseurId = searchParams.get("fournisseurId");
    const limit = parseInt(searchParams.get("limit") || "10");
    const filters = {};

    // Search filter - recherche dans motif et description du fournisseur
    if (searchQuery) {
      filters.OR = [
        { motif: { contains: searchQuery, mode: "insensitive" } },
        {
          fournisseur: {
            nom: { contains: searchQuery, mode: "insensitive" },
          },
        },
      ];
    }

    // Compte filter
    if (compte !== "all") {
      filters.compte = compte;
    }

    // Statut filter
    if (statut !== "all") {
      filters.statut = statut;
    }

    // Méthode de paiement filter
    if (methodePaiement !== "all") {
      filters.methodePaiement = methodePaiement;
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
    const body = await req.json();
    const { id, statut } = body;

    if (!id || !statut) {
      return NextResponse.json(
        { error: "ID et statut sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le statut est valide
    const statutsValides = ["en_attente", "paye", "en_retard", "annule"];
    if (!statutsValides.includes(statut)) {
      return NextResponse.json(
        { error: "Statut invalide" },
        { status: 400 }
      );
    }

    // Mettre à jour le statut du règlement
    const reglement = await prisma.reglement.update({
      where: { id },
      data: { statut },
    });

    return NextResponse.json({
      reglement,
      message: "Statut mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID du règlement requis" },
        { status: 400 }
      );
    }

    // Utiliser une transaction Prisma pour garantir la cohérence des données
    const result = await prisma.$transaction(async (tx) => {
      // Récupérer le règlement avec ses relations
      const reglement = await tx.reglement.findUnique({
        where: { id },
        include: {
          cheque: true,
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

      // Supprimer le règlement (le chèque sera supprimé automatiquement grâce au cascade)
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