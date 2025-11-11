import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { permissionEngine } from '@/lib/rbac/permission-engine';
import { roleService } from '@/lib/rbac/role-service';
import {
  UpdateUserData,
  SafeUserWithRole,
} from '@/lib/types/rbac';
import {
  PERMISSION_ACTIONS,
  RESOURCE_TYPES,
  ROLE_TYPES,
} from '@/lib/rbac/permissions';
import {
  InsufficientPermissionsError,
  UserNotFoundError,
  ValidationError,
} from '@/lib/rbac/errors';
import bcrypt from 'bcrypt';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/users/[id] - Get user details with permission-based access control
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id: targetUserId } = params;

    // Check if user has permission to view this specific user
    const canAccessUser = await permissionEngine.canAccessUserData(currentUser.id, targetUserId);
    
    if (!canAccessUser) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to view this user',
          requiredPermission: 'users:read'
        },
        { status: 403 }
      );
    }

    // Get user with role and team information
    const user = await prisma.user.findUnique({
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

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          message: 'The requested user does not exist',
        },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password, ...safeUser } = user;

    return NextResponse.json({
      user: safeUser as SafeUserWithRole,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id] - Update user with scope validation
 * 
 * Request body:
 * - name: User's full name (optional)
 * - email: User's email address (optional)
 * - roleId: Role ID to assign (optional, Admin only)
 * - teamId: Team ID to assign (optional, Admin/Team Leader)
 * - isActive: Whether user is active (optional, Admin only)
 * - password: New password (optional, Admin or self)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id: targetUserId } = params;

    // Check if user has permission to update this specific user
    const canAccessUser = await permissionEngine.canAccessUserData(currentUser.id, targetUserId);
    
    if (!canAccessUser) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to update this user',
          requiredPermission: 'users:update'
        },
        { status: 403 }
      );
    }

    // Get current user permissions
    const userPermissions = await permissionEngine.getUserPermissions(currentUser.id);
    const isAdmin = userPermissions.accessScope.organizationWide;
    const isSelfUpdate = currentUser.id === targetUserId;

    // Get target user
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
          message: 'The requested user does not exist',
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, email, roleId, teamId, isActive, password }: UpdateUserData & { password?: string } = body;

    // Validate permissions for specific fields
    if (roleId !== undefined && !isAdmin) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only administrators can change user roles',
          requiredPermission: 'users:manage_roles',
        },
        { status: 403 }
      );
    }

    if (isActive !== undefined && !isAdmin) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only administrators can change user active status',
          requiredPermission: 'users:manage_status',
        },
        { status: 403 }
      );
    }

    if (teamId !== undefined && !isAdmin) {
      // Team leaders can assign users to their teams
      const canManageTeam = await permissionEngine.canAccessTeamData(currentUser.id, teamId);
      if (!canManageTeam) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            code: 'TEAM_ACCESS_DENIED',
            message: 'You do not have permission to assign users to this team',
          },
          { status: 403 }
        );
      }
    }

    if (password !== undefined && !isAdmin && !isSelfUpdate) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only change your own password',
          requiredPermission: 'users:change_password',
        },
        { status: 403 }
      );
    }

    // Validate email format if provided
    if (email && email !== targetUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format',
          },
          { status: 400 }
        );
      }

      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== targetUserId) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Email is already taken',
          },
          { status: 400 }
        );
      }
    }

    // Validate role if provided
    if (roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Invalid role ID',
          },
          { status: 400 }
        );
      }
    }

    // Validate team if provided
    if (teamId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Invalid team ID',
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (teamId !== undefined) updateData.teamId = teamId;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (password !== undefined) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
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
    const { password: _, ...safeUser } = updatedUser;

    return NextResponse.json({
      message: 'User updated successfully',
      user: safeUser as SafeUserWithRole,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
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

/**
 * DELETE /api/users/[id] - Delete user (Admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id: targetUserId } = params;

    // Check if user has permission to delete users (Admin only)
    const hasPermission = await permissionEngine.checkPermission(
      currentUser.id,
      PERMISSION_ACTIONS.DELETE,
      RESOURCE_TYPES.USERS
    );

    if (!hasPermission) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only administrators can delete users',
          requiredPermission: 'users:delete'
        },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'You cannot delete your own account',
        },
        { status: 400 }
      );
    }

    // Get target user
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
          message: 'The requested user does not exist',
        },
        { status: 404 }
      );
    }

    // Delete user (this will cascade to related records due to Prisma schema)
    await prisma.user.delete({
      where: { id: targetUserId },
    });



    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}