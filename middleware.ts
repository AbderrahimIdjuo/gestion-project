import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Get the auth object by calling the auth function
  const authObject = await auth();

  // Define routes that require authentication
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
  ];

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // If user is not authenticated and trying to access protected routes, redirect to sign-in
  if (!authObject.userId && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (
    authObject.userId &&
    (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role-based access control for specific routes
  if (authObject.userId) {
    // Admin-only routes
    if (pathname.startsWith("/admin")) {
      const userRole = (authObject.sessionClaims?.metadata as any)?.role;
      if (userRole !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Commercant-only routes
    if (pathname.startsWith("/commercant")) {
      const userRole = (authObject.sessionClaims?.metadata as any)?.role;
      if (userRole !== "commercant" && userRole !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
