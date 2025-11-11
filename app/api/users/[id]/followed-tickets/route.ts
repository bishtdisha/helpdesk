import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { followerService } from '@/lib/services/follower-service';
import { permissionEngine } from '@/lib/rbac/permission-engine';

/**
 * GET /api/users/:id/followed-tickets - Get all tickets a user is following
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = params.id;

    // Validate userId
    if (!userId || userId.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'userId is required',
        },
        { status: 400 }
      );
    }

    // Check if current user can view this user's followed tickets
    // Users can view their own followed tickets
    // Admins and Team Leaders can view followed tickets of users in their scope
    if (currentUser.id !== userId) {
      // Get user permissions to check if they can access other users' data
      const userPermissions = await permissionEngine.getUserPermissions(currentUser.id);
      const accessScope = userPermissions.accessScope;

      // If not organization-wide access, check if the target user is in their teams
      if (!accessScope.organizationWide) {
        // Get the target user's team
        const targetUser = await permissionEngine.getUserWithRole(userId);
        
        if (!targetUser) {
          return NextResponse.json(
            {
              error: 'User not found',
              code: 'USER_NOT_FOUND',
              message: 'User not found',
            },
            { status: 404 }
          );
        }

        // Check if target user is in one of the current user's accessible teams
        const canAccess = !targetUser.teamId || accessScope.teamIds.includes(targetUser.teamId);
        
        if (!canAccess) {
          return NextResponse.json(
            {
              error: 'Access denied',
              code: 'ACCESS_DENIED',
              message: 'You do not have permission to view this user\'s followed tickets',
            },
            { status: 403 }
          );
        }
      }
    }

    // Get followed tickets
    const tickets = await followerService.getFollowedTickets(userId);

    return NextResponse.json({
      tickets,
      total: tickets.length,
    });
  } catch (error) {
    console.error('Error fetching followed tickets:', error);
    
    if (error instanceof Error && error.message.includes('User not found')) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
