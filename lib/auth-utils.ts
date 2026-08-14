import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

/**
 * Utility functions for authentication and role management
 */

export type UserRole = "admin" | "commercant";

export class AuthHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthHttpError";
    this.status = status;
  }
}

/**
 * Convert AuthHttpError to a JSON NextResponse, or null if not an auth error.
 */
export function authErrorResponse(error: unknown) {
  if (error instanceof AuthHttpError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  // Backward-compatible with previous throw new Error("Authentication required")
  if (error instanceof Error) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (
      error.message.startsWith("Access denied") ||
      error.message.includes("Admin role required") ||
      error.message.includes("Required role")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
  }
  return null;
}

/**
 * Get the current user's role from Clerk metadata
 * @returns The user's role or "commercant" as default
 */
export async function getUserRole(): Promise<UserRole> {
  const user = await currentUser();
  return (user?.publicMetadata?.role as UserRole) || "commercant";
}

/**
 * Check if the current user has a specific role
 * @param requiredRole - The role required to access the resource
 * @returns true if user has the required role, false otherwise
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const userRole = await getUserRole();

  // Admin has access to everything
  if (userRole === "admin") return true;

  // Check if user has the exact required role
  return userRole === requiredRole;
}

/**
 * Check if the current user is an admin
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  return await hasRole("admin");
}

/**
 * Check if the current user is a commercant
 * @returns true if user is commercant, false otherwise
 */
export async function isCommercant(): Promise<boolean> {
  return await hasRole("commercant");
}

/**
 * Update a user's role (admin only)
 * @param userId - The ID of the user to update
 * @param newRole - The new role to assign
 * @returns Promise that resolves when the role is updated
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<void> {
  // Verify the current user is an admin
  if (!(await isAdmin())) {
    throw new AuthHttpError("Only administrators can update user roles", 403);
  }

  const client = await clerkClient();
  await client.users.updateUser(userId, {
    publicMetadata: {
      role: newRole,
    },
  });
}

/**
 * Get all users with their roles (admin only)
 * @returns Array of users with their metadata
 */
export async function getAllUsersWithRoles() {
  // Verify the current user is an admin
  if (!(await isAdmin())) {
    throw new AuthHttpError("Only administrators can view all users", 403);
  }

  const client = await clerkClient();
  const response = await client.users.getUserList();

  return response.data.map((user: any) => ({
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.publicMetadata?.role || "commercant",
    createdAt: user.createdAt,
    lastSignInAt: user.lastSignInAt,
  }));
}

/**
 * Require a signed-in user (any role).
 */
export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthHttpError("Authentication required", 401);
  }

  return { userId };
}

/**
 * Server-side role check for API routes
 * Use this in API routes to ensure only users with specific roles can access them
 */
export async function requireRole(requiredRole: UserRole) {
  const { userId } = await requireAuth();
  const userRole = await getUserRole();

  if (userRole !== "admin" && userRole !== requiredRole) {
    throw new AuthHttpError(
      `Access denied. Required role: ${requiredRole}`,
      403
    );
  }

  return { userId, userRole };
}

/**
 * Server-side admin check for API routes
 * Use this in API routes to ensure only admins can access them
 */
export async function requireAdmin() {
  const { userId } = await requireAuth();
  const userRole = await getUserRole();

  if (userRole !== "admin") {
    throw new AuthHttpError("Access denied. Admin role required.", 403);
  }

  return { userId, userRole };
}

/**
 * Server-side admin check for pages and layouts.
 * Redirects to sign-in if unauthenticated, or home if not admin.
 */
export async function requireAdminPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userRole = await getUserRole();
  if (userRole !== "admin") {
    redirect("/");
  }

  return { userId, userRole };
}

/**
 * Check if a user exists in Clerk
 * @param userId - The user ID to check
 * @returns true if user exists, false otherwise
 */
export async function userExistsInClerk(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    await client.users.getUser(userId);
    return true;
  } catch {
    return false;
  }
}
