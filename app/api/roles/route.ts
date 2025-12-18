import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/server-auth';

/**
 * GET /api/roles - List all available roles
 * 
 * This endpoint returns all roles in the system for use in dropdowns and selectors.
 * Access is restricted to authenticated users.
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get all roles
    const roles = await prisma.role.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      roles,
    });
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch roles',
      },
      { status: 500 }
    );
  }
}