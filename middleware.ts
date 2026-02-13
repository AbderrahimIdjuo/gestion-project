import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Lightweight middleware: runs ONLY on routes listed in config.matcher.
 * No Clerk API calls, no DB, no fetch. Role checks (admin-only pages)
 * should be done in layout/page or via Clerk JWT session claims.
 */
export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const authResult = await auth();

  const hasUser = !!authResult.userId;

  // Protected route prefixes (must stay in sync with matcher)
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
  ];
  const isProtectedRoute = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Not signed in on protected route → sign-in
  if (!hasUser && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Signed in on auth pages → dashboard
  if (hasUser && (pathname === "/sign-in" || pathname.startsWith("/sign-in/") || pathname === "/sign-up" || pathname.startsWith("/sign-up/"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
});

/**
 * Run middleware on these paths so Clerk auth() works in pages and API routes.
 * API routes that use auth() or requireAdmin() need the matcher to include /api.
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
    "/api/(.*)",
  ],
};
