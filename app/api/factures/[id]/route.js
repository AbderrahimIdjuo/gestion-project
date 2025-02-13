import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function DELETE(_, { params }) {
  const id = params.id;

  const facture = await prisma.factures.delete({
    where: { id },
  });
  return NextResponse.json(facture);
}

// export async function GET(_, { params }) {
//   const { id } = params;  // Use destructuring to get the id from params

//   try {
//     const client = await prisma.employes.findUnique({
//       where: { id },
//     });

//     // If client not found, return a 404 response
//     if (!client) {
//       return NextResponse.json(
//         { message: 'Client not found' },
//         { status: 404 }
//       );
//     }

//     // Return the client data
//     return NextResponse.json({ client });
//   } catch (error) {
//     // Log and return a 500 server error if something goes wrong
//     console.error('Error fetching client data:', error);
//     return NextResponse.json(
//       { message: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }
