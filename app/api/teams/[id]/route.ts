import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { permissionEngine } from '@/lib/rbac/permission-engine';
import {
  UpdateTeamData,
  TeamWithMembers,
} from '@/lib/types/rbac';
import {
  PERMISSION_ACTIONS,
  RESOURCE_TYPES,
} from '@/lib/rbac/permissions';
import {
  InsufficientPermissionsError,
  ValidationError,
} from '@/lib/rbac/errors';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PUT /api/teams/[id] - Update team (Admin only)
 * 
 * Request body:
 * - name: Team name (optional)
 * - description: Team description (optional)
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

    const { id: teamId } = params;

    // Check if user has permission to update teams (Admin only)
    const hasPermission = await permissionEngine.checkPermission(
      currentUser.id,
      PERMISSION_ACTIONS.UPDATE,
      RESOURCE_TYPES.TEAMS
    );

    if (!hasPermission) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only administrators can update teams',
          requiredPermission: 'teams:update'
        },
        { status: 403 }
      );
    }

    // Get current team
    const currentTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            roleId: true,
            isActive: true,
          },
        },
        teamLeaders: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!currentTeam) {
      return NextResponse.json(
        {
          error: 'Team not found',
          code: 'TEAM_NOT_FOUND',
          message: 'The requested team does not exist',
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description }: UpdateTeamData = body;

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Team name cannot be empty',
          },
          { status: 400 }
        );
      }

      // Check if another team with this name already exists
      if (name.trim() !== currentTeam.name) {
        const existingTeam = await prisma.team.findUnique({
          where: { name: name.trim() },
        });

        if (existingTeam) {
          return NextResponse.json(
            {
              error: 'Validation error',
              code: 'VALIDATION_ERROR',
              message: 'Team with this name already exists',
            },
            { status: 400 }
          );
        }
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            roleId: true,
            isActive: true,
          },
        },
        teamLeaders: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
                isActive: true,
              },
            },
          },
        },
      },
    });



    return NextResponse.json({
      message: 'Team updated successfully',
      team: updatedTeam as TeamWithMembers,
    });
  } catch (error) {
    console.error('Error updating team:', error);
    
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
 * DELETE /api/teams/[id] - Delete team with proper validation (Admin only)
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

    const { id: teamId } = params;

    // Check if user has permission to delete teams (Admin only)
    const hasPermission = await permissionEngine.checkPermission(
      currentUser.id,
      PERMISSION_ACTIONS.DELETE,
      RESOURCE_TYPES.TEAMS
    );

    if (!hasPermission) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only administrators can delete teams',
          requiredPermission: 'teams:delete'
        },
        { status: 403 }
      );
    }

    // Get current team with members
    const currentTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        teamLeaders: true,
      },
    });

    if (!currentTeam) {
      return NextResponse.json(
        {
          error: 'Team not found',
          code: 'TEAM_NOT_FOUND',
          message: 'The requested team does not exist',
        },
        { status: 404 }
      );
    }

    // Check if team has active members - prevent deletion if it does
    if (currentTeam.members.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Cannot delete team with active members. Please reassign or remove all members first.',
          details: {
            memberCount: currentTeam.members.length,
          },
        },
        { status: 400 }
      );
    }

    // Delete team (this will cascade to team_leaders due to Prisma schema)
    await prisma.team.delete({
      where: { id: teamId },
    });



    return NextResponse.json({
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}