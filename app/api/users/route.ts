import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { permissionEngine } from '@/lib/rbac/permission-engine';
import { roleService } from '@/lib/rbac/role-service';
import {
  CreateUserData,
  UserFilters,
  PaginationOptions,
  SafeUserWithRole,
  UserListResponse,
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

/**
 * GET /api/users - List users with role-based filtering and pagination
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - roleId: Filter by role ID
 * - teamId: Filter by team ID
 * - isActive: Filter by active status (default: true for simple mode)
 * - search: Search by name or email
 * - simple: Return simplified response for dropdowns (default: false)
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

    // Check if user has permission to view users
    const hasPermission = await permissionEngine.checkPermission(
      currentUser.id,
      PERMISSION_ACTIONS.READ,
      RESOURCE_TYPES.USERS
    );

    if (!hasPermission) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to view users',
          requiredPermission: 'users:read'
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const roleId = searchParams.get('roleId') || undefined;
    const teamId = searchParams.get('teamId') || undefined;
    const isActiveParam = searchParams.get('isActive');
    const simple = searchParams.get('simple') === 'true';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    // Default to active users only in simple mode
    const isActive = isActiveParam ? isActiveParam === 'true' : (simple ? true : undefined);
    const search = searchParams.get('search') || undefined;

    // Get user's access scope to determine filtering
    const userPermissions = await permissionEngine.getUserPermissions(currentUser.id);
    const accessScope = userPermissions.accessScope;

    // Build where clause based on user's permissions
    let whereClause: any = {};

    // Filter out soft-deleted users by default
    if (!includeDeleted) {
      whereClause.isDeleted = false;
    }

    // Apply role-based filtering
    if (!accessScope.organizationWide) {
      // Non-admin users can only see users in their teams
      if (accessScope.teamIds.length > 0) {
        whereClause.OR = [
          { teamId: { in: accessScope.teamIds } },
          { id: currentUser.id }, // Always allow users to see themselves
        ];
      } else {
        // User can only see themselves
        whereClause.id = currentUser.id;
      }
    }

    // Apply additional filters
    if (roleId) {
      whereClause.roleId = roleId;
    }

    if (teamId) {
      // Check if user can access this team
      const canAccessTeam = await permissionEngine.canAccessTeamData(currentUser.id, teamId);
      if (!canAccessTeam) {
        return NextResponse.json(
          { 
            error: 'Team access denied',
            code: 'TEAM_ACCESS_DENIED',
            message: 'You do not have permission to view users from this team'
          },
          { status: 403 }
        );
      }
      whereClause.teamId = teamId;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (search) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where: whereClause });

    // For simple dropdown response, return only id, name, and email
    if (simple) {
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: [
          { name: 'asc' },
          { email: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      });

      return NextResponse.json({
        users,
        total,
        page,
        limit,
      });
    }

    // Get users with pagination for full response
    const users = await prisma.user.findMany({
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
    const safeUsers: SafeUserWithRole[] = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    const response: UserListResponse = {
      users: safeUsers,
      total,
      page,
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    
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
 * POST /api/users - Create a new user (Admin only)
 * 
 * Request body:
 * - email: User's email address (required)
 * - name: User's full name (required)
 * - password: User's password (required)
 * - roleId: Role ID to assign (optional)
 * - teamId: Team ID to assign (optional)
 * - isActive: Whether user is active (optional, default: true)
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

    // Check if user has permission to create users (Admin only)
    const hasPermission = await permissionEngine.checkPermission(
      currentUser.id,
      PERMISSION_ACTIONS.CREATE,
      RESOURCE_TYPES.USERS
    );

    if (!hasPermission) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only administrators can create users',
          requiredPermission: 'users:create'
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, name, password, roleId, teamId, isActive = true }: CreateUserData = body;

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Email, name, and password are required',
        },
        { status: 400 }
      );
    }

    // Validate email format
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

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'User with this email already exists',
        },
        { status: 400 }
      );
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        roleId,
        teamId,
        isActive,
      },
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
    const { password: _, ...safeUser } = newUser;

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: safeUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    
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