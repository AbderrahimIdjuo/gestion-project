import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { isStockEntreeCharge } from "@/lib/stock";

export const dynamic = "force-dynamic";

const STOCK_SORTIE_FOURNISSEUR_NOM = "STOCK(sortie)";

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function isStockSortieFournisseur(nom) {
  return typeof nom === "string" && nom.trim() === STOCK_SORTIE_FOURNISSEUR_NOM;
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

    const produit = await prisma.produits.findUnique({
      where: { id },
      select: {
        id: true,
        designation: true,
        reference: true,
        prixAchat: true,
        Unite: true,
        stock: true,
        stocksEntrepot: {
          select: {
            id: true,
            entrepotId: true,
            quantite: true,
            entrepot: { select: { id: true, nom: true } },
          },
          orderBy: { entrepot: { nom: "asc" } },
        },
      },
    });

    if (!produit) {
      return NextResponse.json(
        { message: "Produit introuvable." },
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

    const rawLignes = await prisma.blGroupsProduits.findMany({
      where: {
        produitId: id,
        group: {
          bonLivraison: {
            ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
          },
        },
      },
      include: {
        group: {
          select: {
            charge: true,
            bonLivraison: {
              select: {
                id: true,
                numero: true,
                date: true,
                type: true,
                fournisseur: {
                  select: { id: true, nom: true },
                },
              },
            },
          },
        },
      },
    });

    const mouvements = [];
    for (const line of rawLignes) {
      const bl = line.group?.bonLivraison;
      if (!bl) continue;
      if (isStockSortieFournisseur(bl.fournisseur?.nom)) continue;
      if (isStockEntreeCharge(line.group?.charge)) continue;

      const isRetour = bl.type === "retour";
      const quantiteAbs = Number(line.quantite) || 0;
      const quantite = isRetour ? -quantiteAbs : quantiteAbs;
      const prixUnite = round2(line.prixUnite || 0);
      mouvements.push({
        id: line.id,
        date: bl.date,
        numero: bl.numero,
        bonLivraisonId: bl.id,
        type: isRetour ? "retour" : "achats",
        fournisseur: {
          id: bl.fournisseur?.id || null,
          nom: bl.fournisseur?.nom || "—",
        },
        quantite,
        quantiteAbs,
        prixUnite,
        montant: round2(quantite * prixUnite),
      });
    }

    const lignes = [...mouvements].sort((a, b) => -compareDatesAsc(a, b));
    const achatsOnly = mouvements.filter(l => l.type !== "retour");

    let quantiteTotale = 0;
    let quantiteAchetee = 0;
    let quantiteRetournee = 0;
    let montantTotal = 0;
    let montantAchats = 0;
    let prixMin = null;
    let prixMax = null;
    for (const l of mouvements) {
      quantiteTotale += l.quantite;
      montantTotal += l.montant;
      if (l.type === "retour") {
        quantiteRetournee += l.quantiteAbs;
      } else {
        quantiteAchetee += l.quantiteAbs;
        montantAchats += l.quantiteAbs * l.prixUnite;
        if (prixMin === null || l.prixUnite < prixMin) prixMin = l.prixUnite;
        if (prixMax === null || l.prixUnite > prixMax) prixMax = l.prixUnite;
      }
    }
    montantTotal = round2(montantTotal);
    quantiteTotale = round2(quantiteTotale);
    quantiteAchetee = round2(quantiteAchetee);
    quantiteRetournee = round2(quantiteRetournee);
    const prixMoyen =
      quantiteAchetee > 0 ? round2(montantAchats / quantiteAchetee) : null;

    const dernierAchat = [...achatsOnly].sort(
      (a, b) => -compareDatesAsc(a, b)
    )[0];

    const byFournisseur = new Map();
    for (const l of mouvements) {
      const key = l.fournisseur.id || l.fournisseur.nom;
      if (!byFournisseur.has(key)) {
        byFournisseur.set(key, []);
      }
      byFournisseur.get(key).push(l);
    }

    const parFournisseur = [];
    for (const [, items] of byFournisseur) {
      const achats = items
        .filter(i => i.type !== "retour")
        .sort(compareDatesAsc);
      const retours = items.filter(i => i.type === "retour");

      const evolutionPrix = [];
      for (const item of achats) {
        const last = evolutionPrix[evolutionPrix.length - 1];
        if (last && last.prix === item.prixUnite) {
          last.nbAchats += 1;
          last.quantite = round2(last.quantite + item.quantiteAbs);
          last.dateFin = item.date;
        } else {
          evolutionPrix.push({
            prix: item.prixUnite,
            dateDebut: item.date,
            dateFin: item.date,
            nbAchats: 1,
            quantite: round2(item.quantiteAbs),
            quantiteRetournee: 0,
            delta: last ? round2(item.prixUnite - last.prix) : null,
          });
        }
      }

      let qteRetourneeFournisseur = 0;
      for (const ret of retours) {
        qteRetourneeFournisseur += ret.quantiteAbs;
        let palier = evolutionPrix.find(p => p.prix === ret.prixUnite);
        if (!palier) {
          palier = {
            prix: ret.prixUnite,
            dateDebut: ret.date,
            dateFin: ret.date,
            nbAchats: 0,
            quantite: 0,
            quantiteRetournee: 0,
            delta: null,
          };
          evolutionPrix.push(palier);
        }
        palier.quantiteRetournee = round2(
          palier.quantiteRetournee + ret.quantiteAbs
        );
        if (
          ret.date &&
          (!palier.dateFin || new Date(ret.date) > new Date(palier.dateFin))
        ) {
          palier.dateFin = ret.date;
        }
      }

      const qteAchetee = round2(
        achats.reduce((s, i) => s + i.quantiteAbs, 0)
      );
      const montantNet = round2(items.reduce((s, i) => s + i.montant, 0));
      const lastAchat = achats[achats.length - 1];

      parFournisseur.push({
        fournisseur: items[0].fournisseur,
        quantite: round2(qteAchetee - qteRetourneeFournisseur),
        quantiteAchetee: qteAchetee,
        quantiteRetournee: round2(qteRetourneeFournisseur),
        montant: montantNet,
        dernierPrix: lastAchat?.prixUnite ?? null,
        nbAchats: achats.length,
        nbRetours: retours.length,
        evolutionPrix,
      });
    }

    parFournisseur.sort((a, b) => b.montant - a.montant);

    return NextResponse.json({
      produit,
      lignes,
      resume: {
        quantiteTotale,
        quantiteAchetee,
        quantiteRetournee,
        montantTotal,
        prixMin,
        prixMax,
        prixMoyen,
        dernierPrix: dernierAchat?.prixUnite ?? null,
        dernierFournisseur: dernierAchat?.fournisseur ?? null,
      },
      parFournisseur,
    });
  } catch (error) {
    console.error("Error fetching product history:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
