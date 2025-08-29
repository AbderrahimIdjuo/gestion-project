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
  } else {
    return "Inconnu";
  }
}

export function typeDepenseLabel(typeDepense) {
  if (typeDepense === "all") {
    return "Tous";
  } else if (typeDepense === "fixe") {
    return "Charges fixes";
  } else if (typeDepense === "variante") {
    return "Charges variantes";
  } else if (typeDepense === "charges") {
    return "Toutes les charges";
  }
}

export function typeLabel(type) {
  if (type === "recette") {
    return "Recette";
  } else if (type === "depense") {
    return "Dépense";
  } else if (type === "vider") {
    return "Vider la caisse";
  } else if (type === "all") {
    return "Tous";
  } else {
    return type;
  }
}
