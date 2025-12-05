import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET() {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // Pad month with leading zero if needed (e.g., 1 -> 01, 12 -> 12)
    const paddedMonth = month.toString().padStart(2, "0");

    // Search pattern: DEV-YYYY/MM or DEV-YYYY/M (to handle both formats)
    const searchPattern = `DEV-${year}/${month}`;
    const searchPatternPadded = `DEV-${year}/${paddedMonth}`;

    console.log(
      "Searching for devis with pattern:",
      searchPattern,
      "or",
      searchPatternPadded
    );

    // Search for devis matching current year/month pattern
    // Using contains to match both DEV-YYYY/M and DEV-YYYY/MM formats
    const devisOfMonth = await prisma.devis.findMany({
      where: {
        OR: [
          {
            numero: {
              contains: searchPattern,
              mode: "insensitive",
            },
          },
          {
            numero: {
              contains: searchPatternPadded,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("devisOfMonth count:", devisOfMonth?.length || 0);
    console.log("devisOfMonth", devisOfMonth);

    // Get the last devi number by comparing the sequence number at the end
    const getLastDeviNumber = devisOfMonth => {
      if (!devisOfMonth || devisOfMonth.length === 0) {
        console.log("No devis found for current month");
        return null;
      }

      return devisOfMonth.reduce((maxDevi, currentDevi) => {
        // Extract sequence numbers using regex
        const maxMatch = maxDevi.numero.match(/DEV-\d{4}\/\d{1,2}-(\d+)/);
        const currentMatch = currentDevi.numero.match(
          /DEV-\d{4}\/\d{1,2}-(\d+)/
        );

        if (!maxMatch || !currentMatch) {
          console.log(
            "Regex match failed for:",
            maxDevi.numero,
            "or",
            currentDevi.numero
          );
          return maxDevi;
        }

        const maxSeq = parseInt(maxMatch[1], 10);
        const currentSeq = parseInt(currentMatch[1], 10);

        return currentSeq > maxSeq ? currentDevi : maxDevi;
      }, devisOfMonth[0]);
    };

    const lastDevi = getLastDeviNumber(devisOfMonth);
    console.log("lastDevi", lastDevi);

    // Return the response
    return NextResponse.json({
      lastDevi,
    });
  } catch (error) {
    console.error("Error in GET /api/devis/lastDevis:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch last devis",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
