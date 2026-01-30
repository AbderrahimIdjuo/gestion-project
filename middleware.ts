import { createClerkClient } from "@clerk/backend";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const authObject = await auth();

  // Create Clerk client instance
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  });

  // Routes à exclure de la vérification (SSO callback, API, etc.)
  const excludedRoutes = [
    "/sso-callback",
    "/api",
    "/_next",
    "/favicon.ico",
    "/no-access",
  ];

  const isExcludedRoute = excludedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Si c'est une route exclue, laisser passer
  if (isExcludedRoute) {
    return NextResponse.next();
  }

  // Routes protégées
  const protectedRoutes = [
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

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Si pas connecté et route protégée → rediriger
  if (!authObject.userId && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Vérification du rôle pour TOUS les utilisateurs connectés
  if (authObject.userId) {
    try {
      const user = await clerkClient.users.getUser(authObject.userId);

      // On suppose que tu stockes le rôle dans `publicMetadata.role`
      const role = user.publicMetadata.role as string | undefined;

      // Si aucun rôle → refuser l'accès à toute l'app
      if (!role) {
        return NextResponse.redirect(new URL("/no-access", request.url));
      }

      // Paramètres: accès réservé aux admins uniquement
      if (pathname.startsWith("/parametres")) {
        if (role !== "admin") {
          return NextResponse.redirect(new URL("/no-access", request.url));
        }
      }

      // Employés: accès réservé aux admins uniquement
      if (pathname.startsWith("/Employes")) {
        if (role !== "admin") {
          return NextResponse.redirect(new URL("/no-access", request.url));
        }
      }
    } catch (error) {
      console.error("Error fetching user in middleware:", error);
      // En cas d'erreur, rediriger vers no-access pour éviter les boucles
      return NextResponse.redirect(new URL("/no-access", request.url));
    }
  }

  // Si déjà connecté et essaie d'aller sur /sign-in ou /sign-up → redirect dashboard
  if (
    authObject.userId &&
    (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
