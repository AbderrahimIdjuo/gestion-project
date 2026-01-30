import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const sortBy = searchParams.get("sortBy") || "quantite"; // "quantite" ou "montant"


  // Plage en UTC à partir des dates civiles YYYY-MM-DD (même résultat "ce mois" / "personnalisée")
  let dateFilter = null;
  if (from && to) {
    const fromStr = from.includes("T") ? from.slice(0, 10) : from;
    const toStr = to.includes("T") ? to.slice(0, 10) : to;
    const [yF, mF, dF] = fromStr.split("-").map(Number);
    const [yT, mT, dT] = toStr.split("-").map(Number);
    const startDate = new Date(Date.UTC(yF, mF - 1, dF, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(yT, mT - 1, dT, 23, 59, 59, 999));
    dateFilter = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };
  }

  const filters = {};
  if (dateFilter) {
    filters.date = dateFilter.date;
  }
  // Pour les règlements prévus : même plage sur datePrelevement
  const dateFilterPrelevement = dateFilter
    ? { datePrelevement: dateFilter.date }
    : null;

  const [
    nbrClients,
    nbrFournisseurs,
    nbrProduits,
    nbrCommandes,
    nbrBonLivraison,
    nbrDevis,
    reglementsPrevus,
    transactionsRecettes,
    transactionsDepense,
    aggDepensesFixes,
    aggDepensesVariantes,
    caisse,
    comptePersonnel,
    compteProfessionnel,
    produitsPlusAchetes,
  ] = await Promise.all([
    prisma.clients.count(),
    prisma.fournisseurs.count(),
    prisma.produits.count(),
    prisma.commandeFourniture.count({
      where: {
        date: filters.date,
      },
    }),
    prisma.bonLivraison.count({
      where: {
        date: filters.date,
      },
    }),
    prisma.devis.count({
      where: filters.date ? { createdAt: filters.date } : {},
    }),
    dateFilterPrelevement
      ? prisma.reglement.findMany({
          where: {
            datePrelevement: dateFilterPrelevement.datePrelevement,
            compte: "compte professionnel",
          },
          select: { montant: true },
        })
      : Promise.resolve([]),
    prisma.transactions.findMany({
      where: {
        type: "recette",
        date: filters.date,
      },
    }),
    prisma.transactions.findMany({
      where: {
        type: "depense",
        date: filters.date,
      },
    }),
    prisma.transactions.aggregate({
      where: {
        type: "depense",
        typeDepense: "fixe",
        ...(filters.date && { date: filters.date }),
      },
      _sum: { montant: true },
      _count: { id: true },
    }),
    prisma.transactions.aggregate({
      where: {
        type: "depense",
        OR: [{ typeDepense: "variante" }, { typeDepense: null }],
        ...(filters.date && { date: filters.date }),
      },
      _sum: { montant: true },
      _count: { id: true },
    }),
    prisma.comptesBancaires.findFirst({
      where: {
        compte: "caisse",
      },
    }),
    prisma.comptesBancaires.findFirst({
      where: {
        compte: "compte personnel",
      },
    }),
    prisma.comptesBancaires.findFirst({
      where: {
        compte: "compte professionnel",
      },
    }),
  ]);

  const recettes = transactionsRecettes.reduce(
    (acc, trans) => acc + trans.montant,
    0
  );
  const depenses = transactionsDepense.reduce(
    (acc, trans) => acc + trans.montant,
    0
  );
  const depensesFixes = aggDepensesFixes._sum?.montant ?? 0;
  const depensesVariantes = aggDepensesVariantes._sum?.montant ?? 0;
  const benefice = recettes - depensesFixes - depensesVariantes;
  const nbrRecettes = transactionsRecettes.length;
  const nbrDepenses = transactionsDepense.length;
  const nbrDepensesFixes = aggDepensesFixes._count?.id ?? 0;
  const nbrDepensesVariantes = aggDepensesVariantes._count?.id ?? 0;

  const sommeReglementsPrevus =
    reglementsPrevus.reduce((acc, r) => acc + r.montant, 0) ?? 0;
  const soldeComptePro = compteProfessionnel?.solde ?? 0;
  const differenceBalance = soldeComptePro - sommeReglementsPrevus;

  return NextResponse.json({
    nbrClients,
    nbrFournisseurs,
    nbrProduits,
    nbrCommandes,
    nbrBonLivraison,
    nbrDevis,
    recettes,
    depenses,
    depensesFixes,
    depensesVariantes,
    benefice,
    nbrRecettes,
    nbrDepenses,
    nbrDepensesFixes,
    nbrDepensesVariantes,
    caisse: caisse?.solde,
    comptePersonnel: comptePersonnel?.solde,
    compteProfessionnel: compteProfessionnel?.solde,
    sommeReglementsPrevus,
    differenceBalance,
    produitsPlusAchetes,
  });
}
