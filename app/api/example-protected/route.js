import { requireAdmin, requireRole } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

/**
 * Example API route demonstrating role-based access control
 *
 * This route shows how to:
 * 1. Check if user is authenticated
 * 2. Verify user has required role
 * 3. Return different data based on role
 */

// Route accessible to both commercant and admin roles
export async function GET(request) {
  try {
    // Verify user has at least commercant role
    const { userId, userRole } = await requireRole("commercant");

    return NextResponse.json({
      message: "Access granted",
      userId,
      userRole,
      data: {
        message: "This data is accessible to commercant and admin users",
        timestamp: new Date().toISOString(),
        role: userRole,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// Route accessible only to admin users
export async function POST(request) {
  try {
    // Verify user is admin
    const { userId, userRole } = await requireAdmin();

    const body = await request.json();

    return NextResponse.json({
      message: "Admin access granted",
      userId,
      userRole,
      data: {
        message: "This operation is only available to admin users",
        receivedData: body,
        timestamp: new Date().toISOString(),
        role: userRole,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// Route accessible only to commercant users (admin can also access)
export async function PUT(request) {
  try {
    // Verify user has commercant role
    const { userId, userRole } = await requireRole("commercant");

    const body = await request.json();

    return NextResponse.json({
      message: "Commercant access granted",
      userId,
      userRole,
      data: {
        message: "This operation is available to commercant and admin users",
        receivedData: body,
        timestamp: new Date().toISOString(),
        role: userRole,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
