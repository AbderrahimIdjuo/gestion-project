import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const resopns = await req.json();
    const {
      numero,
      clientId,
      articls,
      statut,
      sousTotal,
      tva,
      reduction,
      total,
      typeReduction,
      note,
      echeance,
    } = resopns;

    const result = await prisma.$transaction(async (prisma) => {
      await prisma.devis.create({
        data: {
          numero,
          clientId,
          statut,
          sousTotal,
          tva: parseFloat(tva),
          reduction,
          total,
          typeReduction,
          note,
          echeance,
          articls: {
            create: articls.map((articl) => ({
              key: articl.key, //permet de supprimer un articl doublon
              height: articl.height || 0,
              length: articl.length || 0,
              unite: articl.unite || "U",
              width: articl.width || 0,
              designation: articl.designation,
              quantite: articl.quantite,
              prixUnite: articl.prixUnite || 0,
              montant: articl.quantite * articl.prixUnite,
            })),
          },
        },
      });
    });
    return NextResponse.json({ result });
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
    const requestBody = await req.json();
    const {
      id,
      numero,
      clientId,
      articls,
      statut,
      sousTotal,
      tva,
      reduction,
      total,
      typeReduction,
      note,
      echeance,
    } = requestBody;

    // Fetch existing devis with articls
    const devi = await prisma.devis.findUnique({
      where: { id },
      include: { articls: true },
    });

    // If the devis is not found, return an error
    if (!devi) {
      return NextResponse.json({ message: "Devi not found" }, { status: 404 });
    }

    // Extract existing article IDs
    const existingIds = new Set(devi.articls.map((articl) => articl.id));
    const incomingIds = new Set(articls.map((articl) => articl.id));

    // Categorize articles
    const existingArticls = articls.filter((articl) =>
      existingIds.has(articl.id)
    );
    const newArticls = articls.filter((articl) => !existingIds.has(articl.id));
    const deletedArticls = devi.articls.filter(
      (articl) => !incomingIds.has(articl.id)
    );

    const result = await prisma.$transaction(async (tx) => {
      // Delete old articls only if necessary
      if (deletedArticls.length > 0) {
        await tx.articls.deleteMany({
          where: {
            id: { in: deletedArticls.map((p) => p.id) },
          },
        });
      }

      // Update devis and its articles
      await tx.devis.update({
        where: { id },
        data: {
          numero,
          clientId,
          statut,
          sousTotal,
          tva,
          reduction,
          total,
          typeReduction,
          note,
          echeance,
          articls: {
            update: existingArticls.map((articl) => ({
              where: { id: articl.id },
              data: {
                key: articl.key,
                height: articl.height,
                length: articl.length,
                width: articl.width,
                unite: articl.unite,
                designation: articl.designation,
                quantite: articl.quantite,
                prixUnite: articl.prixUnite,
                montant: articl.quantite * articl.prixUnite,
              },
            })),
            create: newArticls.map((articl) => ({
              key: articl.key,
              length: articl.length,
              width: articl.width || 0,
              unite: articl.unite,
              designation: articl.designation,
              quantite: articl.quantite,
              prixUnite: articl.prixUnite,
              montant: articl.quantite * articl.prixUnite,
            })),
          },
        },
      });
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error updating devis:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        {
          message:
            "Duplicate field error: A record with this value already exists.",
        },
        { status: 409 }
      );
    }

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
  const statut = searchParams.get("statut");
  const from = searchParams.get("from"); // Start date
  const to = searchParams.get("to"); // End date
  const minTotal = searchParams.get("minTotal");
  const maxTotal = searchParams.get("maxTotal");

  const filters = {};

  const devisPerPage = 10;

  // Search filter by numero and client name
  filters.OR = [
    { numero: { contains: searchQuery, mode: "insensitive" } },
    { client: { nom: { contains: searchQuery, mode: "insensitive" } } },
  ];

  // Statut filter
  if (statut !== "all") {
    filters.statut = statut;
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

  // Fetch filtered commandes with pagination and related data
  const [devis, totalDevis, deviMaxTotal, lastDevi] = await Promise.all([
    prisma.devis.findMany({
      where: filters,
      skip: (page - 1) * devisPerPage,
      take: devisPerPage,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        articls: true,
      },
    }),
    prisma.devis.count({ where: filters }), // Get total count for pagination
    prisma.devis.findFirst({
      orderBy: {
        total: "desc", // Get the commande with the maximum total
      },
      select: {
        total: true, // Only fetch the total field
      },
    }),
    prisma.devis.findFirst({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalDevis / devisPerPage);
  // Extract devis numbers for transaction lookup
  const devisNumbers = devis.map((c) => c.numero);

  // Fetch transactions for the commandes
  const transactionsList = await prisma.transactions.findMany({
    where: { reference: { in: devisNumbers } },
  });

  // Fetch ordersGroups
  const bLGroupdsList = await prisma.bLGroups.findMany({
    where: { devisNumero: { in: devisNumbers } },
    include: {
      bonLivraison: {
        select: {
          numero: true,
          fournisseur: {
            select: {
              nom: true,
            },
          },
        },
      },
      produits: {
        include: {
          produit: {
            select: {
              designation: true,
              prixAchat: true,
            },
          },
        },
      },
    },
  });
  // Return the response
  return NextResponse.json({
    devis,
    totalPages,
    maxMontant: deviMaxTotal?.total || 0,
    totalDevis,
    transactionsList,
    bLGroupdsList,
    lastDevi,
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
