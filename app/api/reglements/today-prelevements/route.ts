// import { NextResponse } from "next/server";
// import prisma from "../../../../lib/prisma";

// export const dynamic = "force-dynamic";

// export async function GET() {
//   try {
//     // Get today's date at 00:00:00
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Get tomorrow's date at 00:00:00 to use as upper bound
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     // Fetch all règlements where datePrelevement = today AND statusPrelevement = "en_attente"
//     const todayReglements = await prisma.reglement.findMany({
//       where: {
//         datePrelevement: {
//           gte: today,
//           lt: tomorrow,
//         },
//         statusPrelevement: "en_attente",
//       },
//       include: {
//         fournisseur: {
//           select: {
//             id: true,
//             nom: true,
//             email: true,
//             telephone: true,
//             adresse: true,
//             ice: true,
//           },
//         },
//         cheque: {
//           select: {
//             id: true,
//             numero: true,
//             dateReglement: true,
//             datePrelevement: true,
//           },
//         },
//         factureAchats: {
//           select: {
//             id: true,
//             numero: true,
//           },
//         },
//       },
//       orderBy: {
//         datePrelevement: "asc",
//       },
//     });

//     // Fetch all règlements where datePrelevement < today AND statusPrelevement = "en_attente" (en retard)
//     const overdueReglements = await prisma.reglement.findMany({
//       where: {
//         datePrelevement: {
//           not: null,
//           lt: today, // Date de prélèvement est dans le passé
//         },
//         statusPrelevement: "en_attente",
//       },
//       include: {
//         fournisseur: {
//           select: {
//             id: true,
//             nom: true,
//             email: true,
//             telephone: true,
//             adresse: true,
//             ice: true,
//           },
//         },
//         cheque: {
//           select: {
//             id: true,
//             numero: true,
//             dateReglement: true,
//             datePrelevement: true,
//           },
//         },
//         factureAchats: {
//           select: {
//             id: true,
//             numero: true,
//           },
//         },
//       },
//       orderBy: {
//         datePrelevement: "asc",
//       },
//     });

//     // Combine both lists with a type indicator
//     const allReglements = [
//       ...todayReglements.map((r) => ({ ...r, notificationType: "today" as const })),
//       ...overdueReglements.map((r) => ({ ...r, notificationType: "overdue" as const })),
//     ];

//     return NextResponse.json({
//       reglements: allReglements,
//       count: allReglements.length,
//       todayCount: todayReglements.length,
//       overdueCount: overdueReglements.length,
//     });
//   } catch (error) {
//     console.error(
//       "Erreur lors de la récupération des prélèvements:",
//       error
//     );
//     return NextResponse.json(
//       {
//         error: "Erreur lors de la récupération des prélèvements",
//       },
//       { status: 500 }
//     );
//   }
// }


