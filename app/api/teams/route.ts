import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { permissionEngine } from '@/lib/rbac/permission-engine';
import {
  CreateTeamData,
  TeamFilters,
  PaginationOptions,
  TeamWithMembers,
  TeamListResponse,
} from '@/lib/types/rbac';
import {
  PERMISSION_ACTIONS,
  RESOURCE_TYPES,
  ROLE_TYPES,
} from '@/lib/rbac/permissions';
import {
  InsufficientPermissionsError,
  ValidationError,
} from '@/lib/rbac/errors';

/**
 * GET /api/teams - List teams with role-based team visibility
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - search: Search by team name or description
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

    // Check if user has permission to view teams
    const hasPermission = await permissionEngine.checkPermission(
      currentUser.id,
      PERMISSION_ACTIONS.READ,
      RESOURCE_TYPES.TEAMS
    );

    if (!hasPermission) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to view teams',
          requiredPermission: 'teams:read'
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search') || undefined;

    // Get user's access scope to determine filtering
    const userPermissions = await permissionEngine.getUserPermissions(currentUser.id);
    const accessScope = userPermissions.accessScope;

    // Build where clause based on user's permissions
    let whereClause: any = {};

    // Apply role-based filtering
    if (!accessScope.organizationWide) {
      // Non-admin users can only see teams they have access to
      if (accessScope.teamIds.length > 0) {
        whereClause.id = { in: accessScope.teamIds };
      } else {
        // User has no team access - return empty result
        return NextResponse.json({
          teams: [],
          total: 0,
          page,
          limit,
        });
      }
    }

    // Apply search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.team.count({ where: whereClause });

    // Get teams with members and leaders
    const teams = await prisma.team.findMany({
      where: whereClause,
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
      orderBy: [
        { name: 'asc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    const response: TeamListResponse = {
      teams: teams as TeamWithMembers[],
      total,
      page,
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching teams:', error);
    
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

/**
 * POST /api/teams - Create a new team (Admin only)
 * 
 * Request body:
 * - name: Team name (required)
 * - description: Team description (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has permission to create teams (Admin only)
    const hasPermission = await permissionEngine.checkPermission(
      currentUser.id,
      PERMISSION_ACTIONS.CREATE,
      RESOURCE_TYPES.TEAMS
    );

    if (!hasPermission) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only administrators can create teams',
          requiredPermission: 'teams:create'
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description }: CreateTeamData = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Team name is required',
        },
        { status: 400 }
      );
    }

    // Check if team with name already exists
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

    // Create team
    const newTeam = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
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



    return NextResponse.json(
      {
        message: 'Team created successfully',
        team: newTeam,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating team:', error);
    
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