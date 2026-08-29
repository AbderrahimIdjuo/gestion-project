export const ENTREPOT_BADGE_COLORS = [
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-sky-100 text-sky-800 border-sky-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  "bg-lime-100 text-lime-800 border-lime-200",
];

export function entrepotBadgeClass(entrepotId) {
  if (!entrepotId) return ENTREPOT_BADGE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < entrepotId.length; i++) {
    hash = (hash * 31 + entrepotId.charCodeAt(i)) >>> 0;
  }
  return ENTREPOT_BADGE_COLORS[hash % ENTREPOT_BADGE_COLORS.length];
}
