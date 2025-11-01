import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withRBACAuth } from '@/lib/rbac/middleware';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '@/lib/rbac/permissions';

/**
 * GET /api/roles - List all available roles
 * 
 * This endpoint returns all roles in the system for use in dropdowns and selectors.
 * Access is restricted to authenticated users who can view users.
 */
export async function GET(request: NextRequest) {
  return withRBACAuth(
    async (req, { user }) => {
      try {
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
    },
    {
      requiredPermission: {
        action: PERMISSION_ACTIONS.READ,
        resource: RESOURCE_TYPES.USERS,
      },
    }
  )(request);
}