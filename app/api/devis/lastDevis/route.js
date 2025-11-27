import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const devisOfMonth = await prisma.devis.findMany({
    where: {
      numero: {
        contains: `DEV-${year}/${month}`,
        mode: "insensitive",
      },
    },
  });

  console.log("devisOfMonth", devisOfMonth);
  // Get the last devi number by comparing the sequence number at the end
  const getLastDeviNumber = devisOfMonth => {
    if (!devisOfMonth || devisOfMonth.length === 0) return null;

    return devisOfMonth.reduce((maxDevi, currentDevi) => {
      // Extract sequence numbers using regex
      const maxMatch = maxDevi.numero.match(/DEV-\d{4}\/\d{1,2}-(\d+)/);
      const currentMatch = currentDevi.numero.match(/DEV-\d{4}\/\d{1,2}-(\d+)/);

      if (!maxMatch || !currentMatch) return maxDevi;

      const maxSeq = parseInt(maxMatch[1]);
      const currentSeq = parseInt(currentMatch[1]);

      return currentSeq > maxSeq ? currentDevi : maxDevi;
    }, devisOfMonth[0]);
  };

  const lastDevi = getLastDeviNumber(devisOfMonth);
  console.log("lastDevi", lastDevi);

  // Return the response
  return NextResponse.json({
    lastDevi,
  });
}
