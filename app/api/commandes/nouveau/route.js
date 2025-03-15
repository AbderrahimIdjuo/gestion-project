import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

// export async function GET(req) {
//   // Extract query parameters
//   const { searchParams } = new URL(req.url);
//   const cursor = searchParams.get("cursor") || null; // Default to null if cursor is not provided
//   const limit = parseInt(searchParams.get("limit")) || 10; // Default to 10 if limit is not provided
//   const searchQuery = searchParams.get("query");
//   const filters = {};

//   if (searchQuery) {
//     filters.nom = {
//       contains: searchQuery,
//     };
//   }

//   // Fetch devis and commandes in parallel
//   const [devis, commandes] = await Promise.all([
//     prisma.devis.findMany({
//       include: { client: true },
//     }),
//     prisma.commandes.findMany(),
//   ]);

//   // Filter devis that do not have corresponding commandes
//   const devisList = devis.filter(
//     (devi) =>
//       !commandes.some(
//         (commande) => commande.numero.slice(4, 13) === devi.numero.slice(4, 13)
//       )
//   );

//   // Fetch clients with pagination
//   const clients = await prisma.clients.findMany({
//     where: filters,
//     orderBy: {
//       updatedAt: "desc", // Order by updatedAt in descending order
//     },
//     take: limit, // Number of clients to fetch
//     skip: cursor ? 1 : 0, // Skip the cursor client if it exists
//     cursor: cursor ? { id: cursor } : undefined, // Use cursor for efficient pagination
//   });

//   // Determine the next cursor
//   const lastClient = clients[clients.length - 1];
//   const nextCursor = lastClient ? lastClient.id : null;

//   // Return the response
//   return NextResponse.json({
//     devis: devisList,
//     clients,
//     nextCursor,
//   });
// }

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || null;
    const limit = parseInt(searchParams.get("limit")) || 15;
    const searchQuery = searchParams.get("query");
    const filters = {};

    if (searchQuery) {
      filters.nom = {
        contains: searchQuery,
      };
    }
    // Fetch devis and commandes in parallel
    const [devis, commandes] = await Promise.all([
      prisma.devis.findMany({
        include: { client: true },
      }),
      prisma.commandes.findMany(),
    ]);

    // Filter devis that do not have corresponding commandes
    const devisList = devis.filter(
      (devi) =>
        !commandes.some(
          (commande) =>
            commande.numero.slice(4, 13) === devi.numero.slice(4, 13)
        )
    );
    const clients = await prisma.clients.findMany({
      where: filters,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const lastClient = clients[clients.length - 1];
    const nextCursor = lastClient ? lastClient.id : null;

    return NextResponse.json({ devis : devisList , clients, nextCursor });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
