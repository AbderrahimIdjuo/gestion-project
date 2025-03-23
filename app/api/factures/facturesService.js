"use server";
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function updatePayerStatus() {
  try {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1; // Months are 1-based
    const currentYear = currentDate.getFullYear();

    // Fetch all paid invoices
    const depenses = await prisma.factures.findMany({
      where: {
        payer: true,
      },
    });

    for (const depense of depenses) {
      // Convert `dateReglement` to a Date object if it's not already
      const dateReglement = new Date(depense.dateReglement);

      // Extract year, month, and day
      const reglementYear = dateReglement.getFullYear();
      const reglementMonth = dateReglement.getMonth() + 1; // Months are 1-based

      // Vérifier si la date d'émission est dépassée ET si on est dans un nouveau mois
      if (
        depense.dateEmission <= currentDay &&
        (reglementYear < currentYear ||
          (reglementYear === currentYear && reglementMonth < currentMonth))
      ) {
        await prisma.factures.update({
          where: { id: depense.id },
          data: { payer: false },
        });
      }
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des dépenses:", error);
  }
}
