import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const response = await req.json();
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
      date,
      userId,
      employeId,
    } = response;

    // Validation des données requises
    if (
      !numero ||
      !clientId ||
      !articls ||
      !Array.isArray(articls) ||
      articls.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Données manquantes ou invalides. Le devis doit contenir au moins un article.",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async prisma => {
        await prisma.devis.create({
          data: {
            numero,
            date: date ? new Date(date) : new Date(),
            clientId,
            statut,
            sousTotal: parseFloat(sousTotal) || 0,
            tva: parseFloat(tva) || 0,
            reduction: parseInt(reduction) || 0,
            total: Math.round(Number(total)) || 0,
            totalPaye: 0,
            typeReduction: typeReduction || "%",
            commercantId: employeId || null,
            note: note || "",
            echeance: echeance ? new Date(echeance) : null,
            userId: userId || null,
            articls: {
              create: articls.map(articl => ({
                key: articl.key, //permet de supprimer un articl doublon
                height: parseFloat(articl.height) || 0,
                length: parseFloat(articl.length) || 0,
                unite: articl.unite || "U",
                width: parseFloat(articl.width) || 0,
                designation: articl.designation || "",
                quantite: parseFloat(articl.quantite) || 0,
                prixUnite: parseFloat(articl.prixUnite) || 0,
                montant:
                  (parseFloat(articl.quantite) || 0) *
                  (parseFloat(articl.prixUnite) || 0),
              })),
            },
          },
        });
        // Modifier la dette du client
        // await prisma.clients.update({
        //   where: { id: clientId },
        //   data: {
        //     dette: {
        //       increment: total, // Incrémenter la dette du client
        //     },
        //   },
        // });
      },
      {
        // Temps max d'exécution de la transaction
        timeout: 60_000, // 15 s (par défaut 5_000 ms)
        // Temps max d'attente avant de démarrer (connexion/locks)
        maxWait: 5_000, // optionnel
        // isolationLevel: "ReadCommitted", // optionnel
      }
    );
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error creating devis:", error);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la création du devis.",
        details: error.message || "Erreur inconnue",
      },
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
      date,
      employeId,
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
    const existingIds = new Set(devi.articls.map(articl => articl.id));
    const incomingIds = new Set(articls.map(articl => articl.id));

    // Categorize articles
    const existingArticls = articls.filter(articl =>
      existingIds.has(articl.id)
    );
    const newArticls = articls.filter(articl => !existingIds.has(articl.id));
    const deletedArticls = devi.articls.filter(
      articl => !incomingIds.has(articl.id)
    );

    const result = await prisma.$transaction(async prisma => {
      // Delete old articls only if necessary
      if (deletedArticls.length > 0) {
        await prisma.articls.deleteMany({
          where: {
            id: { in: deletedArticls.map(p => p.id) },
          },
        });
      }

      // Update devis and its articles
      const updateData = {
        numero,
        clientId,
        statut,
        sousTotal,
        tva,
        reduction,
        total: Math.round(Number(total)),
        typeReduction,
        note,
        echeance,
        commercantId: employeId || null,
        date: date || new Date(),
      };

      // Si le statut est "Terminer", définir dateEnd à la date actuelle
      if (statut === "Terminer") {
        updateData.dateEnd = new Date();
      }
      // Si le statut actuel est "Terminer" et le nouveau statut n'est pas "Terminer", réinitialiser dateEnd à null
      else if (devi.statut === "Terminer" && statut !== "Terminer") {
        updateData.dateEnd = null;
      }

      await prisma.devis.update({
        where: { id },
        data: {
          ...updateData,
          articls: {
            update: existingArticls.map(articl => ({
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
            create: newArticls.map(articl => ({
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

      // const difference = parseFloat(total) - parseFloat(devi.total);

      // let detteUpdate = {};

      // if (difference > 0) {
      //   detteUpdate = { increment: difference };
      // } else if (difference < 0) {
      //   detteUpdate = { decrement: -difference };
      // }

      // // Modifier la dette du client
      // if (Object.keys(detteUpdate).length > 0) {
      //   await prisma.clients.update({
      //     where: { id: clientId },
      //     data: {
      //       dette: detteUpdate,
      //     },
      //   });
      // }
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
  const dateStartFrom = searchParams.get("dateStartFrom"); // Date de début - début
  const dateStartTo = searchParams.get("dateStartTo"); // Date de début - fin
  const dateEndFrom = searchParams.get("dateEndFrom"); // Date de fin - début
  const dateEndTo = searchParams.get("dateEndTo"); // Date de fin - fin
  const minTotal = searchParams.get("minTotal");
  const maxTotal = searchParams.get("maxTotal");
  const statutPaiement = searchParams.get("statutPaiement");
  const commercant = searchParams.get("commercant");
  const filters = {};

  const devisPerPage = 10;

  // Search filter by numero, client name, and commercant
  if (searchQuery) {
    filters.OR = [
      { numero: { contains: searchQuery, mode: "insensitive" } },
      { client: { nom: { contains: searchQuery, mode: "insensitive" } } },
      { commercant: { nom: { contains: searchQuery, mode: "insensitive" } } },
    ];
  }

  // Statut filter (supports multiple values separated by "-")
  if (statut && statut !== "all") {
    const statutArray = statut.split("-");
    if (statutArray.length > 0) {
      filters.statut = { in: statutArray };
    }
  }

  // StatutPaiement filter (supports multiple values separated by "-")
  if (statutPaiement && statutPaiement !== "all") {
    const statutPaiementArray = statutPaiement.split("-");
    if (statutPaiementArray.length > 0) {
      filters.statutPaiement = { in: statutPaiementArray };
    }
  }

  // Commercant filter
  if (commercant && commercant !== "all") {
    filters.commercant = {
      nom: commercant,
    };
  }

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

  // Date de début filter
  if (dateStartFrom && dateStartTo) {
    const startDateStart = new Date(dateStartFrom);
    startDateStart.setHours(0, 0, 0, 0); // Set to beginning of the day

    const endDateStart = new Date(dateStartTo);
    endDateStart.setHours(23, 59, 59, 999); // Set to end of the day

    filters.dateStart = {
      gte: startDateStart, // Greater than or equal to start of "dateStartFrom" day
      lte: endDateStart, // Less than or equal to end of "dateStartTo" day
    };
  }

  // Date de fin filter
  if (dateEndFrom && dateEndTo) {
    const startDateEnd = new Date(dateEndFrom);
    startDateEnd.setHours(0, 0, 0, 0); // Set to beginning of the day

    const endDateEnd = new Date(dateEndTo);
    endDateEnd.setHours(23, 59, 59, 999); // Set to end of the day

    filters.dateEnd = {
      gte: startDateEnd, // Greater than or equal to start of "dateEndFrom" day
      lte: endDateEnd, // Less than or equal to end of "dateEndTo" day
    };
  }

  // total range filter
  if (minTotal && maxTotal) {
    filters.total = {
      gte: Number(minTotal),
      lte: Number(maxTotal),
    };
  }

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  // Fetch filtered commandes with pagination and related data
  const [devis, totalDevis, deviMaxTotal] = await Promise.all([
    prisma.devis.findMany({
      where: filters,
      skip: (page - 1) * devisPerPage,
      take: devisPerPage,
      orderBy: { date: "desc" },
      include: {
        client: true,
        articls: true,
        commercant: true,
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
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalDevis / devisPerPage);
  // Extract devis numbers for transaction lookup
  const devisNumbers = devis.map(c => c.numero);

  // Fetch transactions for the commandes
  const transactionsList = await prisma.transactions.findMany({
    where: { reference: { in: devisNumbers } },
  });

  // Fetch ordersGroups
  const bLGroupsList = await prisma.bLGroups.findMany({
    where: { devisNumero: { in: devisNumbers } },
    include: {
      bonLivraison: {
        select: {
          date: true,
          numero: true,
          total: true,
          fournisseur: {
            select: {
              nom: true,
            },
          },
          type: true,
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
    bLGroupsList,
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
