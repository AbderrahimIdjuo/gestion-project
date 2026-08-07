import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  AUTH_PAGE_PATHS,
  isProtectedApiPath,
  isProtectedPagePath,
  matchesPrefix,
} from "@/lib/route-protection";

/**
 * Lightweight middleware: runs ONLY on routes listed in config.matcher.
 * No Clerk API calls, no DB, no fetch. Role checks (admin-only pages)
 * should be done in layout/page or via Clerk JWT session claims.
 *
 * Runtime auth rules live in lib/route-protection.ts.
 * IMPORTANT: config.matcher MUST be an inline string array here —
 * Next.js ignores matchers imported from other modules at build time.
 */
export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const authResult = await auth();

  const hasUser = !!authResult.userId;

  // Not signed in on protected API → 401 JSON (do not redirect; clients expect JSON)
  // Covers /api/* except PUBLIC_API_PREFIXES (webhook, auth) — see route-protection.ts
  if (!hasUser && isProtectedApiPath(pathname)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Not signed in on protected page → sign-in
  if (!hasUser && isProtectedPagePath(pathname)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Signed in on auth pages → dashboard
  if (hasUser && matchesPrefix(pathname, AUTH_PAGE_PATHS)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
});

/**
 * Keep in sync with PROTECTED_PAGE_PREFIXES in lib/route-protection.ts.
 * Inline literals required for Next.js static analysis of the matcher.
 */
export const config = {
  matcher: [
    "/",
    "/sign-in",
    "/sign-in/(.*)",
    "/sign-up",
    "/sign-up/(.*)",
    "/dashboard",
    "/dashboard/(.*)",
    "/admin",
    "/admin/(.*)",
    "/commercant",
    "/commercant/(.*)",
    "/clients",
    "/clients/(.*)",
    "/produits",
    "/produits/(.*)",
    "/ventes",
    "/ventes/(.*)",
    "/achats",
    "/achats/(.*)",
    "/transactions",
    "/transactions/(.*)",
    "/parametres",
    "/parametres/(.*)",
    "/Employes",
    "/Employes/(.*)",
    "/articls",
    "/articls/(.*)",
    // BUG-002: financial / supplier pages
    "/reglement",
    "/reglement/(.*)",
    "/versements",
    "/versements/(.*)",
    "/facturesAchats",
    "/facturesAchats/(.*)",
    "/fournisseurs",
    "/fournisseurs/(.*)",
    // All App Router API routes (public ones allowlisted at runtime)
    "/api/(.*)",
  ],
};
