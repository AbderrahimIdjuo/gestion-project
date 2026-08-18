// lib/functions.js

export function formatMontant(montant) {
  const num = typeof montant === "number" ? montant : parseFloat(montant);
  if (isNaN(num)) return montant;

  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

export function formatMontantRounded(montant) {
  const num = typeof montant === "number" ? montant : parseFloat(montant);
  if (isNaN(num)) return montant;

  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

export function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}

export const formatCurrency = amount => {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
  }).format(amount);
};

export function methodePaiementLabel(transaction) {
  if (transaction.methodePaiement === "versement") {
    return "Versement";
  } else if (transaction.methodePaiement === "cheque") {
    return "Chèque";
  } else if (transaction.methodePaiement === "espece") {
    return "Espèce";
  } else if (transaction.methodePaiement === "traite") {
    return "Traite";
  } else {
    return "Inconnu";
  }
}

export function typeDepenseLabel(typeDepense) {
  if (!typeDepense || typeDepense === "all") {
    return "Tous";
  } else if (typeDepense === "fixe") {
    return "Charges fixes";
  } else if (typeDepense === "variante") {
    return "Charges variantes";
  } else if (typeDepense === "sansType") {
    return "Sans type";
  } else if (typeDepense === "charges") {
    return "Toutes les charges";
  } else if (typeof typeDepense === "string" && typeDepense.includes("-")) {
    return typeDepense
      .split("-")
      .map(t => typeDepenseLabel(t))
      .join(", ");
  }
  return typeDepense;
}

export function typeLabel(type) {
  if (type === "recette") {
    return "Recette";
  } else if (type === "depense") {
    return "Dépense";
  } else if (type === "vider") {
    return "Vider la caisse";
  } else if (type === "transfert") {
    return "Transfert";
  } else if (type === "all") {
    return "Tous";
  } else {
    return type;
  }
}

export function calculateTransactionsTypeTotals(transactions) {
  const empty = {
    totalRecettes: 0,
    totalDepenses: 0,
    totalVider: 0,
    totalTransferts: 0,
    total: 0,
  };

  if (!transactions || transactions.length === 0) {
    return empty;
  }

  const totals = transactions.reduce(
    (acc, transaction) => {
      const montant = transaction.montant || 0;
      if (transaction.type === "recette") {
        acc.totalRecettes += montant;
      } else if (transaction.type === "depense") {
        acc.totalDepenses += montant;
      } else if (transaction.type === "vider") {
        acc.totalVider += montant;
      } else if (transaction.type === "transfert") {
        acc.totalTransferts += montant;
      }
      return acc;
    },
    { ...empty }
  );

  totals.total = totals.totalRecettes - totals.totalDepenses;
  return totals;
}

export function sortTransactionsByDate(transactions) {
  if (!transactions || transactions.length === 0) return [];
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt);
    const dateB = new Date(b.date || b.createdAt);
    return dateA - dateB;
  });
}



export function isCompteProfessionnel(compte) {
  const name = (compte || "").toLowerCase().trim();
  return name === "compte professionnel" || name === "compte professionel";
}

export function isCompteCaisse(compte) {
  return (compte || "").toLowerCase().trim() === "caisse";
}

function sameCompteName(a, b) {
  return (a || "").toLowerCase().trim() === (b || "").toLowerCase().trim();
}

function isViderRapportRecette(transaction, compte) {
  return (
    transaction.type === "vider" &&
    !isCompteCaisse(compte) &&
    !!transaction.compte &&
    sameCompteName(transaction.compte, compte)
  );
}

function isViderRapportDepense(transaction, compte) {
  return transaction.type === "vider" && isCompteCaisse(compte);
}

export function getCompteRapportDesignation(transaction, compte) {
  if (!transaction) return "";
  if (transaction.type === "vider") {
    if (isCompteCaisse(compte)) {
      return transaction.compte
        ? `Vider la caisse vers ${transaction.compte}`
        : "Vider la caisse";
    }
    return "Versement depuis caisse";
  }
  if (transaction.type === "transfert") {
    if (isCompteProfessionnel(compte) && transaction.compte) {
      return `Versement depuis ${transaction.compte}`;
    }
    return "Versement vers le compte pro";
  }
  if (transaction.description) {
    return transaction.description;
  }
  return transaction.lable || "";
}

export function isCompteRapportRecette(transaction, compte) {
  return (
    transaction.type === "recette" ||
    (transaction.type === "transfert" && isCompteProfessionnel(compte)) ||
    isViderRapportRecette(transaction, compte)
  );
}

export function isCompteRapportDepenseCell(transaction, compte) {
  return (
    transaction.type === "depense" ||
    isViderRapportDepense(transaction, compte) ||
    (transaction.type === "transfert" && !isCompteProfessionnel(compte))
  );
}

export function calculateCompteRapportTotals(transactions, compte) {
  const empty = {
    totalRecettes: 0,
    totalDepenses: 0,
    totalTransferts: 0,
    totalTransfertsEntrants: 0,
    totalTransfertsSortants: 0,
    totalEntrant: 0,
    totalSortant: 0,
    solde: 0,
  };

  if (!transactions || transactions.length === 0) {
    return empty;
  }

  const isCaisse = isCompteCaisse(compte);
  const isPro = isCompteProfessionnel(compte);

  const totals = transactions.reduce((acc, transaction) => {
    const montant = transaction.montant || 0;

    if (transaction.type === "recette") {
      acc.totalRecettes += montant;
    }
    if (transaction.type === "depense") {
      acc.totalDepenses += montant;
    }

    if (isCompteRapportRecette(transaction, compte)) {
      acc.totalEntrant += montant;
    }
    if (isCompteRapportDepenseCell(transaction, compte)) {
      acc.totalSortant += montant;
    }

    if (isCaisse) {
      if (transaction.type === "transfert" || transaction.type === "vider") {
        acc.totalTransferts += montant;
      }
    } else if (isViderRapportRecette(transaction, compte)) {
      acc.totalTransfertsEntrants += montant;
    } else if (transaction.type === "transfert") {
      if (isPro) {
        acc.totalTransfertsEntrants += montant;
      } else {
        acc.totalTransfertsSortants += montant;
      }
    }

    return acc;
  }, { ...empty });

  totals.solde = totals.totalRecettes - totals.totalDepenses;
  return totals;
}

export function periodNetChange(transactions, compte) {
  if (!transactions || transactions.length === 0) return 0;
  const isPro = isCompteProfessionnel(compte);
  return transactions.reduce((acc, t) => {
    if (t.type === "recette" || isViderRapportRecette(t, compte)) {
      return acc + t.montant;
    }
    if (t.type === "depense" || isViderRapportDepense(t, compte)) {
      return acc - t.montant;
    }
    if (t.type === "transfert") {
      return isPro ? acc + t.montant : acc - t.montant;
    }
    return acc;
  }, 0);
}

export function sortCompteRapportTransactions(
  transactions,
  soldeInitial,
  compte
) {
  if (!transactions || transactions.length === 0) return [];

  const sorted = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt);
    const dateB = new Date(b.date || b.createdAt);
    return dateA - dateB;
  });

  const isPro = isCompteProfessionnel(compte);
  let runningBalance = soldeInitial || 0;
  return sorted.map(transaction => {
    if (
      transaction.type === "recette" ||
      (transaction.type === "transfert" && isPro) ||
      isViderRapportRecette(transaction, compte)
    ) {
      runningBalance += transaction.montant;
    } else if (
      transaction.type === "depense" ||
      isViderRapportDepense(transaction, compte) ||
      (transaction.type === "transfert" && !isPro)
    ) {
      runningBalance -= transaction.montant;
    }
    return { ...transaction, runningBalance };
  });
}

export function ajouterUneHeure(from) {
    // Si "from" est déjà un objet Date, on l'utilise directement
    const date =
      from instanceof Date ? new Date(from) : new Date(String(from).trim());

    if (isNaN(date.getTime())) {
      throw new Error(`Date invalide : ${from}`);
    }

    date.setHours(date.getHours() + 1);
    return date.toISOString();
  }