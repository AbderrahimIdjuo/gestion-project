import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Public API routes (no Clerk session required).
 * Webhooks verify their own signatures; auth adapters must stay reachable.
 */
function isPublicApiRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/api/webhook") ||
    pathname.startsWith("/api/auth")
  );
}

/**
 * Destructive / sensitive mutation paths that require admin role.
 * Role is read from session claims when present (configure Clerk JWT
 * to include publicMetadata.role for middleware-level checks).
 */
function isAdminMutation(pathname: string, method: string): boolean {
  const m = method.toUpperCase();
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return false;

  const adminPrefixes = [
    "/api/admin",
    "/api/users",
    "/api/import-",
    "/api/importLogo",
    "/api/solde-comptes",
  ];

  return adminPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p)
  );
}

function getRoleFromClaims(authResult: {
  sessionClaims?: Record<string, unknown> | null;
}): string | null {
  const claims = authResult.sessionClaims;
  if (!claims) return null;

  const metadata = (claims.metadata ?? claims.publicMetadata) as
    | Record<string, unknown>
    | undefined;
  const role = metadata?.role;
  return typeof role === "string" ? role : null;
}

/**
 * Lightweight middleware: runs ONLY on routes listed in config.matcher.
 * No Clerk Backend API calls, no DB. Role checks use JWT session claims
 * when available; route handlers still call requireAdmin() as defense in depth.
 */
export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const authResult = await auth();
  const hasUser = !!authResult.userId;

  // --- API protection ---
  if (pathname.startsWith("/api/")) {
    if (isPublicApiRoute(pathname)) {
      return NextResponse.next();
    }

    if (!hasUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Admin gate for sensitive mutations (when role is in session claims)
    if (isAdminMutation(pathname, method)) {
      const role = getRoleFromClaims(authResult);
      // If claims expose role and user is not admin → 403.
      // If claims omit role, allow through; route handlers must call requireAdmin().
      if (role !== null && role !== "admin") {
        return NextResponse.json(
          { error: "Access denied. Admin role required." },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  // --- Page protection ---
  const protectedPrefixes = [
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
    "/reglement",
    "/versements",
    "/facturesAchats",
    "/fournisseurs",
  ];
  const isProtectedRoute = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!hasUser && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (
    hasUser &&
    (pathname === "/sign-in" ||
      pathname.startsWith("/sign-in/") ||
      pathname === "/sign-up" ||
      pathname.startsWith("/sign-up/"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
});

/**
 * Run middleware on these paths so Clerk auth() works in pages and API routes.
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
    "/reglement",
    "/reglement/(.*)",
    "/versements",
    "/versements/(.*)",
    "/facturesAchats",
    "/facturesAchats/(.*)",
    "/fournisseurs",
    "/fournisseurs/(.*)",
    "/api/(.*)",
  ],
};
