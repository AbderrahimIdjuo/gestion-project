import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { STOCK_SORTIE_FOURNISSEUR_NOM } from "@/lib/stock";

export const dynamic = "force-dynamic";

function parseIds(param) {
  if (!param || param === "all") return [];
  return param
    .split(",")
    .map(id => id.trim())
    .filter(Boolean);
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const entrepotIds = parseIds(searchParams.get("entrepotIds"));
    const produitIds = parseIds(searchParams.get("produitIds"));
    const categorieIds = parseIds(searchParams.get("categorieIds"));
    const from = searchParams.get("from");
    const to = searchParams.get("to");

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

    const lignes = await prisma.blGroupsProduits.findMany({
      where: {
        ...(produitIds.length > 0 ? { produitId: { in: produitIds } } : {}),
        ...(entrepotIds.length > 0 ? { entrepotId: { in: entrepotIds } } : {}),
        ...(categorieIds.length > 0
          ? { produit: { categorieId: { in: categorieIds } } }
          : {}),
        group: {
          bonLivraison: {
            type: "achats",
            fournisseur: { nom: STOCK_SORTIE_FOURNISSEUR_NOM },
            ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
          },
        },
      },
      include: {
        produit: {
          include: { categorieProduits: true },
        },
        entrepot: { select: { id: true, nom: true } },
        group: {
          select: {
            id: true,
            devisNumero: true,
            clientName: true,
            charge: true,
            bonLivraison: {
              select: {
                id: true,
                numero: true,
                date: true,
                total: true,
              },
            },
          },
        },
      },
    });

    const mouvements = lignes
      .map(line => {
        const produit = line.produit;
        const bl = line.group?.bonLivraison;
        if (!produit || !bl) return null;
        const quantite = Number(line.quantite) || 0;
        const prixUnite =
          Number(line.prixUnite) || Number(produit.prixAchat) || 0;
        return {
          id: line.id,
          date: bl.date,
          blId: bl.id,
          blNumero: bl.numero,
          produitId: produit.id,
          reference: produit.reference || "",
          designation: produit.designation,
          categorie: produit.categorieProduits?.categorie || "—",
          unite: produit.Unite || "U",
          quantite,
          prixUnite: round2(prixUnite),
          valeur: round2(quantite * prixUnite),
          entrepotId: line.entrepotId || null,
          entrepot: line.entrepot?.nom || "—",
          devisNumero: line.group?.devisNumero || null,
          clientName: line.group?.clientName || null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        if (db !== da) return db - da;
        return (a.blNumero || "").localeCompare(b.blNumero || "");
      });

    const parProduitMap = new Map();
    const blSet = new Set();
    for (const m of mouvements) {
      blSet.add(m.blId);
      if (!parProduitMap.has(m.produitId)) {
        parProduitMap.set(m.produitId, {
          id: m.produitId,
          reference: m.reference,
          designation: m.designation,
          categorie: m.categorie,
          unite: m.unite,
          quantite: 0,
          valeur: 0,
          bls: new Map(),
          devis: new Map(),
        });
      }
      const item = parProduitMap.get(m.produitId);
      item.quantite += m.quantite;
      item.valeur += m.valeur;
      if (!item.bls.has(m.blId)) {
        item.bls.set(m.blId, {
          id: m.blId,
          numero: m.blNumero,
          date: m.date,
          quantite: 0,
          entrepot: m.entrepot,
          entrepotId: m.entrepotId,
          devisNumero: m.devisNumero,
          clientName: m.clientName,
        });
      }
      const blItem = item.bls.get(m.blId);
      blItem.quantite += m.quantite;
      if (m.devisNumero) {
        if (!item.devis.has(m.devisNumero)) {
          item.devis.set(m.devisNumero, {
            numero: m.devisNumero,
            clientName: m.clientName,
            quantite: 0,
          });
        }
        item.devis.get(m.devisNumero).quantite += m.quantite;
      }
    }

    const parProduit = Array.from(parProduitMap.values())
      .map(item => {
        const bls = Array.from(item.bls.values())
          .map(bl => ({
            ...bl,
            quantite: round2(bl.quantite),
          }))
          .sort((a, b) => {
            const da = a.date ? new Date(a.date).getTime() : 0;
            const db = b.date ? new Date(b.date).getTime() : 0;
            return db - da;
          });
        const devis = Array.from(item.devis.values())
          .map(d => ({
            ...d,
            quantite: round2(d.quantite),
          }))
          .sort((a, b) => (a.numero || "").localeCompare(b.numero || ""));
        return {
          id: item.id,
          reference: item.reference,
          designation: item.designation,
          categorie: item.categorie,
          unite: item.unite,
          quantite: round2(item.quantite),
          valeur: round2(item.valeur),
          nbBl: bls.length,
          nbDevis: devis.length,
          bls,
          devis,
        };
      })
      .sort((a, b) => b.valeur - a.valeur);

    const devisNumeros = [
      ...new Set(mouvements.map(m => m.devisNumero).filter(Boolean)),
    ];

    const devisRows =
      devisNumeros.length > 0
        ? await prisma.devis.findMany({
            where: { numero: { in: devisNumeros } },
            include: {
              client: { select: { nom: true } },
            },
          })
        : [];

    const devisByNumero = new Map(devisRows.map(d => [d.numero, d]));

    const devisBilan = devisNumeros
      .map(numero => {
        const d = devisByNumero.get(numero);
        const related = mouvements.filter(m => m.devisNumero === numero);
        const produitsMap = new Map();
        const blNumeros = new Set();
        let quantiteProduits = 0;
        let valeurFournitures = 0;
        for (const m of related) {
          quantiteProduits += m.quantite;
          valeurFournitures += m.valeur;
          blNumeros.add(m.blNumero);
          const produitKey = `${m.produitId}::${m.entrepotId || ""}`;
          if (!produitsMap.has(produitKey)) {
            produitsMap.set(produitKey, {
              id: m.produitId,
              designation: m.designation,
              reference: m.reference,
              unite: m.unite,
              quantite: 0,
              valeur: 0,
              entrepotId: m.entrepotId,
              entrepot: m.entrepot,
            });
          }
          const p = produitsMap.get(produitKey);
          p.quantite += m.quantite;
          p.valeur += m.valeur;
        }
        const total = Number(d?.total) || 0;
        const totalPaye = Number(d?.totalPaye) || 0;
        return {
          numero,
          devisId: d?.id || null,
          date: d?.date || related[0]?.date || null,
          client:
            d?.client?.nom || related[0]?.clientName || "—",
          statut: d?.statut || "—",
          statutPaiement: d?.statutPaiement || "impaye",
          total: round2(total),
          totalPaye: round2(totalPaye),
          reste: round2(total - totalPaye),
          quantiteProduits: round2(quantiteProduits),
          valeurFournitures: round2(valeurFournitures),
          bls: Array.from(blNumeros),
          produits: Array.from(produitsMap.values()).map(p => ({
            ...p,
            quantite: round2(p.quantite),
            valeur: round2(p.valeur),
          })),
        };
      })
      .sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });

    const quantiteTotale = round2(
      mouvements.reduce((acc, m) => acc + m.quantite, 0)
    );
    const valeurTotale = round2(
      mouvements.reduce((acc, m) => acc + m.valeur, 0)
    );
    const totalDevis = round2(
      devisBilan.reduce((acc, d) => acc + d.total, 0)
    );
    const totalPayeDevis = round2(
      devisBilan.reduce((acc, d) => acc + d.totalPaye, 0)
    );

    return NextResponse.json({
      mouvements,
      parProduit,
      devis: devisBilan,
      resume: {
        quantiteTotale,
        valeurTotale,
        nbBl: blSet.size,
        nbProduits: parProduit.length,
        nbDevis: devisBilan.length,
        totalDevis,
        totalPayeDevis,
        resteDevis: round2(totalDevis - totalPayeDevis),
      },
    });
  } catch (error) {
    console.error("GET /api/produits/rapport-sortie:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du rapport stock (sortie)." },
      { status: 500 }
    );
  }
}
