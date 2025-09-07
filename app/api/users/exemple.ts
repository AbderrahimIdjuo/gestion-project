// /app/api/users/create/route.ts
import { createClerkClient } from "@clerk/backend";
import { NextResponse } from "next/server";

// Create Clerk client instance
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function POST(req: Request) {
  try {
    const { nom, email, password, role } = await req.json();

    const user = await clerkClient.users.createUser({
      firstName: nom,
      emailAddress: [email],
      password,
      privateMetadata: { role, active: true },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, role, active } = await req.json();

    // Get the current user to merge old data
    const user = await clerkClient.users.getUser(userId);

    const updatedUser = await clerkClient.users.updateUser(userId, {
      privateMetadata: {
        ...user.privateMetadata, // keep existing values
        ...(role !== undefined && { role }), // update only if provided
        ...(active !== undefined && { active }), // update only if provided
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: users } = await clerkClient.users.getUserList({ limit: 100 });

    const mappedUsers = users
      // Keep only users with a role defined
      .filter(
        u =>
          typeof u.privateMetadata?.role === "string" &&
          u.privateMetadata.role.trim() !== ""
      )
      .map(u => ({
        id: u.id,
        nom: u.firstName,
        email: u.emailAddresses[0]?.emailAddress,
        role: u.privateMetadata.role,
        actif: u.privateMetadata?.active ?? true,
        derniereConnexion: u.lastSignInAt || null,
      }));

    return NextResponse.json(mappedUsers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();

    await clerkClient.users.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
