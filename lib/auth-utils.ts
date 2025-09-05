import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

/**
 * Utility functions for authentication and role management
 */

export type UserRole = "admin" | "commercant";

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
    throw new Error("Only administrators can update user roles");
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
    throw new Error("Only administrators can view all users");
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
 * Server-side role check for API routes
 * Use this in API routes to ensure only users with specific roles can access them
 */
export async function requireRole(requiredRole: UserRole) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Authentication required");
  }

  const userRole = await getUserRole();

  if (userRole !== "admin" && userRole !== requiredRole) {
    throw new Error(`Access denied. Required role: ${requiredRole}`);
  }

  return { userId, userRole };
}

/**
 * Server-side admin check for API routes
 * Use this in API routes to ensure only admins can access them
 */
export async function requireAdmin() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Authentication required");
  }

  const userRole = await getUserRole();

  if (userRole !== "admin") {
    throw new Error("Access denied. Admin role required.");
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
  } catch (error) {
    return false;
  }
}
