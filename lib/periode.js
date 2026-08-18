import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns";

export const PERIODES = [
  { value: "all", label: "Toutes" },
  { value: "aujourd'hui", label: "Aujourd'hui" },
  { value: "ce-mois", label: "Ce mois" },
  { value: "mois-dernier", label: "Le mois dernier" },
  { value: "3-derniers-mois", label: "3 derniers mois" },
  { value: "6-derniers-mois", label: "6 derniers mois" },
  { value: "trimestre-actuel", label: "Trimestre actuel" },
  { value: "trimestre-precedent", label: "Trimestre précédent" },
  { value: "cette-annee", label: "Cette année" },
  { value: "annee-derniere", label: "L'année dernière" },
  { value: "personnalisee", label: "Période personnalisée" },
];

export const PERIODES_SANS_TOUTES = PERIODES.filter(p => p.value !== "all");

export function getDateRangeFromPeriode(periode, startDate, endDate) {
  const now = new Date();

  switch (periode) {
    case "aujourd'hui":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "ce-mois":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "mois-dernier": {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case "3-derniers-mois":
      return {
        from: subMonths(startOfMonth(now), 2),
        to: endOfMonth(now),
      };
    case "6-derniers-mois":
      return {
        from: subMonths(startOfMonth(now), 5),
        to: endOfMonth(now),
      };
    case "trimestre-actuel":
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case "trimestre-precedent": {
      const prevQuarter = subQuarters(now, 1);
      return {
        from: startOfQuarter(prevQuarter),
        to: endOfQuarter(prevQuarter),
      };
    }
    case "cette-annee":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "annee-derniere": {
      const lastYear = subYears(now, 1);
      return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
    }
    case "personnalisee":
      return {
        from: startDate ? new Date(startDate) : null,
        to: endDate ? new Date(endDate) : null,
      };
    default:
      return { from: null, to: null };
  }
}

export function getPeriodeLabel(periode) {
  return PERIODES.find(p => p.value === periode)?.label || periode || "";
}
