/**
 * Centralized route-protection constants for Clerk middleware (BUG-002 audit).
 *
 * Runtime checks (isProtectedPagePath / isProtectedApiPath) are imported by
 * middleware.ts. The middleware `config.matcher` MUST remain an inline string
 * array in middleware.ts — Next.js ignores matchers imported from other modules.
 * Keep PROTECTED_PAGE_PREFIXES in sync with that matcher manually.
 */

/** Page path prefixes that require a signed-in user (redirect → /sign-in). */
export const PROTECTED_PAGE_PREFIXES = [
  "/admin",
  "/commercant",
  "/clients",
  "/produits",
  "/ventes",
  "/achats",
  "/transactions",
  "/parametres",
  "/Employes",
  "/articls",
  "/dashboard",
  // BUG-002: financial / supplier pages previously missing from protection
  "/reglement",
  "/versements",
  "/facturesAchats",
  "/fournisseurs",
] as const;

/**
 * Financial / supplier API prefixes that must never be public.
 * Used for documentation/audits and as a fallback if PROTECT_ALL_APIS is disabled.
 */
export const FINANCIAL_API_PREFIXES = [
  "/api/reglement",
  "/api/reglements",
  "/api/versements",
  "/api/facturesAchats",
  "/api/fournisseurs",
  // Import writes supplier records — same trust boundary as /api/fournisseurs
  "/api/import-fournisseurs",
] as const;

/**
 * When true, every `/api/*` path requires auth except PUBLIC_API_PREFIXES.
 * Prefer this over listing every private API to avoid accidental exposure.
 */
export const PROTECT_ALL_APIS = true;

/** API prefixes that must remain reachable without a Clerk session. */
export const PUBLIC_API_PREFIXES = [
  "/api/webhook", // Clerk (and similar) webhooks authenticate via signature, not session
  "/api/auth", // NextAuth catch-all if present
] as const;

/** Auth UI paths (signed-in users are redirected away from these). */
export const AUTH_PAGE_PATHS = ["/sign-in", "/sign-up"] as const;

/** True when pathname equals prefix or is a nested path under it. */
export function matchesPrefix(
  pathname: string,
  prefixes: readonly string[]
): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Whether an API pathname must reject unauthenticated requests. */
export function isProtectedApiPath(pathname: string): boolean {
  if (!pathname.startsWith("/api")) return false;
  // Allowlisted public endpoints (webhooks, auth callbacks)
  if (matchesPrefix(pathname, PUBLIC_API_PREFIXES)) return false;
  if (PROTECT_ALL_APIS) return true;
  return matchesPrefix(pathname, FINANCIAL_API_PREFIXES);
}

/** Whether a page pathname must redirect unauthenticated users to sign-in. */
export function isProtectedPagePath(pathname: string): boolean {
  return matchesPrefix(pathname, PROTECTED_PAGE_PREFIXES);
}
