import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { permissionEngine } from '@/lib/rbac/permission-engine';
import {
  SafeUserWithRole,
} from '@/lib/types/rbac';
import {
  PERMISSION_ACTIONS,
  RESOURCE_TYPES,
} from '@/lib/rbac/permissions';
import {
  InsufficientPermissionsError,
} from '@/lib/rbac/errors';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/teams/[id]/members - Get team members with permission-based access
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - search: Search by member name or email
 * - isActive: Filter by active status
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

    const { id: teamId } = params;

    // Check if user can access this team's data
    const canAccessTeam = await permissionEngine.canAccessTeamData(currentUser.id, teamId);
    
    if (!canAccessTeam) {
      return NextResponse.json(
        { 
          error: 'Team access denied',
          code: 'TEAM_ACCESS_DENIED',
          message: 'You do not have permission to view members of this team',
          requiredPermission: 'teams:read'
        },
        { status: 403 }
      );
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true },
    });

    if (!team) {
      return NextResponse.json(
        {
          error: 'Team not found',
          code: 'TEAM_NOT_FOUND',
          message: 'The requested team does not exist',
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search') || undefined;
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam ? isActiveParam === 'true' : undefined;

    // Build where clause for team members
    let whereClause: any = {
      teamId: teamId,
    };

    // Apply filters
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where: whereClause });

    // Get team members with pagination
    const members = await prisma.user.findMany({
      where: whereClause,
      include: {
        role: true,
        team: true,
        teamLeaderships: {
          include: {
            team: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
        { email: 'asc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Remove password from response
    const safeMembers: SafeUserWithRole[] = members.map(member => {
      const { password, ...safeMember } = member;
      return safeMember;
    });

    // Get team leaders for this team
    const teamLeaders = await prisma.teamLeader.findMany({
      where: { teamId: teamId },
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
    });

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
      },
      members: safeMembers,
      leaders: teamLeaders.map(tl => tl.user),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    
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