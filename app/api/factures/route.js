"use server";
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { connect } from "http2";

export async function POST(req) {
  try {
    const response = await req.json();
    const { numero, devisId, date } = response;
    console.log("response : ", response);
    console.log("◀ body          :", response); // raw JSON
    console.log("◀ body.date     :", date);
    console.log("◀ new Date(date):", new Date(date).toISOString());
    const resultat = await prisma.factures.create({
      data: {
        numero,
        date,
        devis: {
          connect: { id: devisId },
        },
      },
    });
    return NextResponse.json({
      message: "facture créée avec succès.",
      resultat,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la création de la facture." },
      { status: 500 }
    );
  }
}

// export async function POST(req) {
//   try {
//     const response = await req.json();
//     const {
//       numero,
//       lable,
//       type,
//       montant,
//       description,
//       payer,
//       dateEmission,
//       compte,
//     } = response;
//     const transactionResult = await prisma.$transaction(async (tx) => {
//       const factureRecurrente = await tx.factures.create({
//         data: {
//           numero,
//           lable,
//           type,
//           montant: montant || 0,
//           description,
//           payer,
//           dateEmission,
//         },
//       });
//       // Si une facture est payer créer une transaction
//       if (type === "variante") {
//         await tx.transactions.create({
//           data: {
//             reference: "Dépense variante",
//             type: "depense",
//             montant,
//             compte,
//             lable,
//           },
//         });
//       }
//       // Si une facture est du type "variante" créer une transaction
//       if (payer) {
//         await tx.transactions.create({
//           data: {
//             reference: numero,
//             type: "depense",
//             montant,
//             compte,
//             lable,
//           },
//         });
//       }
//       return factureRecurrente;
//     });
//     return NextResponse.json({
//       message: "facture recurrente créée avec succès.",
//       transactionResult,
//     });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { message: "Une erreur est survenue lors de la création de la facture." },
//       { status: 500 }
//     );
//   }
// }

export async function PUT(req) {
  try {
    const response = await req.json();
    const { id, numero, lable, type, montant, description, payer } = response;
    const result = await prisma.factures.update({
      where: { id },
      data: {
        numero,
        lable,
        type,
        montant,
        description,
        payer,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.log(error);
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
    { devis: { numero: { contains: searchQuery, mode: "insensitive" } } },
  ];
  console.log("from : ", from, "to:", to);
  
  // Date range filter
  if (from && to) {
    filters.date = {
      gte: new Date(from), // Greater than or equal to "from"
      lte: new Date(to), // Less than or equal to "to"
    };
  }

  // total range filter
  if (minTotal && maxTotal) {
    filters.devis = {
      total: {
        gte: Number(minTotal),
        lte: Number(maxTotal),
      },
    };
  }

  // Fetch filtered commandes with pagination and related data
  const [factures, listFactures, totalFactures] = await Promise.all([
    prisma.factures.findMany({
      where: filters,
      skip: (page - 1) * facturesPerPage,
      take: facturesPerPage,
      orderBy: { createdAt: "desc" },
      include: {
        devis: {
          select: {
            numero: true,
            articls: true,
            client: {
              select: {
                nom: true,
                ice: true,
                titre: true,
              },
            },
            total: true,
            sousTotal: true,
            tva: true,
          },
        },
      },
    }),
    prisma.factures.findMany({
      select: {
        devis: {
          select: {
            total: true,
          },
        },
      },
    }),
    prisma.factures.count({ where: filters }),
  ]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalFactures / facturesPerPage);
  // set the maxMontant
  const factureMax = listFactures.reduce((max, f) =>
    f.devis.total > max.devis.total ? f : max
  );

  // Return the response
  return NextResponse.json({
    factures,
    maxMontant: factureMax.devis.total,
    totalPages,
  });
}
