import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { clerkClient } from '@clerk/nextjs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify the current user is an admin
    await requireAdmin();
    
    const { role } = await request.json();
    const userId = params.id;

    // Validate role
    if (role !== 'admin' && role !== 'commercant') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "commercant"' },
        { status: 400 }
      );
    }

    // Update the user's role
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        role: role
      }
    });

    return NextResponse.json(
      { message: `User role updated to ${role}` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user role:', error);
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }
    
    if (error.message.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
