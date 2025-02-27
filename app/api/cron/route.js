"use server";
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
    if (req.method === 'POST') {
      try {
    // Obtenir le jour actuel du mois (ex: 26 si on est le 26 février)
    const todayDay = new Date().getDate();
 
  // Mettre à jour uniquement les factures payées dont la date d'émission est aujourd'hui
  const updated = await prisma.factures.updateMany({
    where: {
      payer: true,
      dateEmission: todayDay, // Seules les factures avec ce jour précis seront modifiées
    },
    data: { payer: false },
  });

  console.log(`✅ ${updated.count} factures mises à jour en impayées pour le jour ${todayDay}`);
      } catch (error) {
        console.error('Erreur lors de la mise à jour des factures :', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour des factures.' });
      } finally {
        await prisma.$disconnect();
      }
    } else {
      res.status(405).json({ error: 'Méthode non autorisée.' });
    }
  }