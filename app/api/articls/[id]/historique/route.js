import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function compareDatesAsc(a, b) {
  const da = a.date ? new Date(a.date).getTime() : 0;
  const db = b.date ? new Date(b.date).getTime() : 0;
  if (da !== db) return da - db;
  return (a.numero || "").localeCompare(b.numero || "");
}

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const articl = await prisma.items.findUnique({
      where: { id },
      select: {
        id: true,
        designation: true,
        categorieProduits: {
          select: { id: true, categorie: true },
        },
      },
    });

    if (!articl) {
      return NextResponse.json(
        { message: "Article introuvable." },
        { status: 404 }
      );
    }

    const dateFilter = {};
    if (from) {
      const startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      dateFilter.gte = startDate;
    }
    if (to) {
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.lte = endDate;
    }

    const devisDateWhere = Object.keys(dateFilter).length
      ? {
          OR: [{ date: dateFilter }, { date: null, createdAt: dateFilter }],
        }
      : {};

    const rawLignes = await prisma.articls.findMany({
      where: {
        designation: {
          equals: articl.designation,
          mode: "insensitive",
        },
        ...(Object.keys(devisDateWhere).length
          ? { devi: devisDateWhere }
          : {}),
      },
      include: {
        devi: {
          select: {
            id: true,
            numero: true,
            date: true,
            createdAt: true,
            statut: true,
            client: {
              select: { id: true, nom: true },
            },
          },
        },
      },
    });

    const mouvements = [];
    for (const line of rawLignes) {
      const devis = line.devi;
      if (!devis) continue;

      const quantite = Number(line.quantite) || 0;
      const prixUnite = round2(line.prixUnite || 0);
      const montant = round2(
        Number(line.montant) || quantite * prixUnite
      );

      mouvements.push({
        id: line.id,
        date: devis.date || devis.createdAt,
        numero: devis.numero,
        devisId: devis.id,
        statut: devis.statut,
        client: {
          id: devis.client?.id || null,
          nom: devis.client?.nom || "—",
        },
        quantite,
        prixUnite,
        montant,
        unite: line.unite || "U",
      });
    }

    const lignes = [...mouvements].sort((a, b) => -compareDatesAsc(a, b));

    let quantiteTotale = 0;
    let montantTotal = 0;
    let prixMin = null;
    let prixMax = null;
    for (const l of mouvements) {
      quantiteTotale += l.quantite;
      montantTotal += l.montant;
      if (prixMin === null || l.prixUnite < prixMin) prixMin = l.prixUnite;
      if (prixMax === null || l.prixUnite > prixMax) prixMax = l.prixUnite;
    }
    montantTotal = round2(montantTotal);
    quantiteTotale = round2(quantiteTotale);
    const prixMoyen =
      quantiteTotale > 0 ? round2(montantTotal / quantiteTotale) : null;

    const derniereVente = lignes[0];
    const unite = derniereVente?.unite || "U";

    const byClient = new Map();
    for (const l of mouvements) {
      const key = l.client.id || l.client.nom;
      if (!byClient.has(key)) {
        byClient.set(key, []);
      }
      byClient.get(key).push(l);
    }

    const parClient = [];
    for (const [, items] of byClient) {
      const ventes = [...items].sort(compareDatesAsc);

      const evolutionPrix = [];
      for (const item of ventes) {
        const last = evolutionPrix[evolutionPrix.length - 1];
        if (last && last.prix === item.prixUnite) {
          last.nbVentes += 1;
          last.quantite = round2(last.quantite + item.quantite);
          last.dateFin = item.date;
        } else {
          evolutionPrix.push({
            prix: item.prixUnite,
            dateDebut: item.date,
            dateFin: item.date,
            nbVentes: 1,
            quantite: round2(item.quantite),
            delta: last ? round2(item.prixUnite - last.prix) : null,
          });
        }
      }

      const qteVendue = round2(ventes.reduce((s, i) => s + i.quantite, 0));
      const montantNet = round2(items.reduce((s, i) => s + i.montant, 0));
      const lastVente = ventes[ventes.length - 1];

      parClient.push({
        client: items[0].client,
        quantite: qteVendue,
        montant: montantNet,
        dernierPrix: lastVente?.prixUnite ?? null,
        nbVentes: ventes.length,
        evolutionPrix,
      });
    }

    parClient.sort((a, b) => b.montant - a.montant);

    return NextResponse.json({
      articl: {
        ...articl,
        unite,
      },
      lignes,
      resume: {
        quantiteTotale,
        montantTotal,
        prixMin,
        prixMax,
        prixMoyen,
        dernierPrix: derniereVente?.prixUnite ?? null,
        dernierClient: derniereVente?.client ?? null,
      },
      parClient,
    });
  } catch (error) {
    console.error("Error fetching article history:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
