import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { roleService } from '@/lib/rbac/role-service';
import { permissionEngine } from '@/lib/rbac/permission-engine';
import {
  RoleAssignmentData,
} from '@/lib/types/rbac';
import {
  PERMISSION_ACTIONS,
  RESOURCE_TYPES,
} from '@/lib/rbac/permissions';
import {
  InsufficientPermissionsError,
  UserNotFoundError,
  RoleNotFoundError,
  ValidationError,
  RoleAssignmentDeniedError,
} from '@/lib/rbac/errors';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/users/[id]/assign-role - Assign role to user (Admin only)
 * 
 * Request body:
 * - roleId: Role ID to assign (required)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id: targetUserId } = params;

    // Check if user has permission to assign roles (Admin only)
    const hasPermission = await permissionEngine.checkPermission(
      currentUser.id,
      PERMISSION_ACTIONS.ASSIGN,
      RESOURCE_TYPES.ROLES
    );

    if (!hasPermission) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only administrators can assign roles',
          requiredPermission: 'roles:assign'
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { roleId }: RoleAssignmentData = body;

    // Validate required fields
    if (!roleId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Role ID is required',
        },
        { status: 400 }
      );
    }

    // Validate that the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        role: true,
        team: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          message: 'The specified user does not exist',
        },
        { status: 404 }
      );
    }

    // Validate that the role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        {
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND',
          message: 'The specified role does not exist',
        },
        { status: 404 }
      );
    }

    // Prevent self-role modification for safety
    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'You cannot change your own role',
        },
        { status: 400 }
      );
    }

    // Use role service to assign the role
    await roleService.assignRole(currentUser.id, targetUserId, roleId);

    // Get updated user information
    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        role: true,
        team: true,
        teamLeaderships: {
          include: {
            team: true,
          },
        },
      },
    });

    // Remove password from response
    const { password, ...safeUser } = updatedUser!;

    return NextResponse.json({
      message: 'Role assigned successfully',
      user: safeUser,
      assignedRole: role,
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    
    if (error instanceof InsufficientPermissionsError) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          code: error.code,
          message: error.message,
          requiredPermission: error.requiredPermission,
        },
        { status: 403 }
      );
    }

    if (error instanceof UserNotFoundError) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      );
    }

    if (error instanceof RoleNotFoundError) {
      return NextResponse.json(
        {
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      );
    }

    if (error instanceof RoleAssignmentDeniedError) {
      return NextResponse.json(
        {
          error: 'Role assignment denied',
          code: 'ROLE_ASSIGNMENT_DENIED',
          message: error.message,
        },
        { status: 403 }
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: error.code,
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}