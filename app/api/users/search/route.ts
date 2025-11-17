import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { permissionEngine } from '@/lib/rbac/permission-engine';

/**
 * GET /api/users/search - Search users for mentions
 * 
 * Query parameters:
 * - q: Search query (name or email)
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse query parameter
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    // If query is empty, return empty array
    if (!query.trim()) {
      return NextResponse.json({ users: [] });
    }

    // Get user's access scope to determine filtering
    const userPermissions = await permissionEngine.getUserPermissions(currentUser.id);
    const accessScope = userPermissions.accessScope;

    // Build where clause based on user's permissions
    let whereClause: any = {
      isActive: true, // Only show active users
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Apply role-based filtering
    if (!accessScope.organizationWide) {
      // Non-admin users can only see users in their teams
      if (accessScope.teamIds.length > 0) {
        whereClause.AND = [
          {
            OR: [
              { teamId: { in: accessScope.teamIds } },
              { id: currentUser.id }, // Always allow users to see themselves
            ],
          },
        ];
      } else {
        // User can only see themselves
        whereClause.id = currentUser.id;
      }
    }

    // Get users (limit to 10 for mentions)
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: [
        { name: 'asc' },
      ],
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
