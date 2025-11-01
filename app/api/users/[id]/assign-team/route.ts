import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { roleService } from '@/lib/rbac/role-service';
import { permissionEngine } from '@/lib/rbac/permission-engine';
import {
  TeamAssignmentData,
} from '@/lib/types/rbac';
import {
  PERMISSION_ACTIONS,
  RESOURCE_TYPES,
} from '@/lib/rbac/permissions';
import {
  InsufficientPermissionsError,
  UserNotFoundError,
  TeamNotFoundError,
  ValidationError,
  TeamAccessDeniedError,
} from '@/lib/rbac/errors';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/users/[id]/assign-team - Assign user to team
 * 
 * Request body:
 * - teamId: Team ID to assign (required)
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

    // Parse request body
    const body = await request.json();
    const { teamId }: TeamAssignmentData = body;

    // Validate required fields
    if (!teamId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Team ID is required',
        },
        { status: 400 }
      );
    }

    // Check if user has permission to manage teams or access this specific team
    const canManageTeams = await permissionEngine.checkPermission(
      currentUser.id,
      PERMISSION_ACTIONS.MANAGE,
      RESOURCE_TYPES.TEAMS
    );

    const canAccessTeam = await permissionEngine.canAccessTeamData(currentUser.id, teamId);

    if (!canManageTeams && !canAccessTeam) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          code: 'TEAM_ACCESS_DENIED',
          message: 'You do not have permission to assign users to this team',
          requiredPermission: 'teams:manage'
        },
        { status: 403 }
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

    // Validate that the team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        {
          error: 'Team not found',
          code: 'TEAM_NOT_FOUND',
          message: 'The specified team does not exist',
        },
        { status: 404 }
      );
    }

    // Check if user is already in the team
    if (targetUser.teamId === teamId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'User is already assigned to this team',
        },
        { status: 400 }
      );
    }

    // Use role service to assign the team
    await roleService.assignToTeam(currentUser.id, targetUserId, teamId);

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
      message: 'Team assigned successfully',
      user: safeUser,
      assignedTeam: team,
    });
  } catch (error) {
    console.error('Error assigning team:', error);
    
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

    if (error instanceof TeamAccessDeniedError) {
      return NextResponse.json(
        {
          error: 'Team access denied',
          code: 'TEAM_ACCESS_DENIED',
          message: error.message,
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

    if (error instanceof TeamNotFoundError) {
      return NextResponse.json(
        {
          error: 'Team not found',
          code: 'TEAM_NOT_FOUND',
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
 * DELETE /api/users/[id]/assign-team - Remove user from team
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

    // Get target user to find their current team
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

    if (!targetUser.teamId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'User is not assigned to any team',
        },
        { status: 400 }
      );
    }

    // Check if user has permission to manage teams or access this specific team
    const canManageTeams = await permissionEngine.checkPermission(
      currentUser.id,
      PERMISSION_ACTIONS.MANAGE,
      RESOURCE_TYPES.TEAMS
    );

    const canAccessTeam = await permissionEngine.canAccessTeamData(currentUser.id, targetUser.teamId);

    if (!canManageTeams && !canAccessTeam) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          code: 'TEAM_ACCESS_DENIED',
          message: 'You do not have permission to remove users from this team',
          requiredPermission: 'teams:manage'
        },
        { status: 403 }
      );
    }

    // Use role service to remove from team
    await roleService.removeFromTeam(currentUser.id, targetUserId, targetUser.teamId);

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
      message: 'User removed from team successfully',
      user: safeUser,
      removedFromTeam: targetUser.team,
    });
  } catch (error) {
    console.error('Error removing user from team:', error);
    
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

    if (error instanceof TeamAccessDeniedError) {
      return NextResponse.json(
        {
          error: 'Team access denied',
          code: 'TEAM_ACCESS_DENIED',
          message: error.message,
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

    if (error instanceof TeamNotFoundError) {
      return NextResponse.json(
        {
          error: 'Team not found',
          code: 'TEAM_NOT_FOUND',
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