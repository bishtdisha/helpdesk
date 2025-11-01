/**
 * Example API routes demonstrating RBAC middleware usage
 * 
 * This file shows how to use the RBAC middleware components in Next.js API routes.
 * These examples can be used as templates for implementing protected API endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createProtectedRoute,
  createUserManagementRoute,
  createTeamManagementRoute,
  createSelfProfileRoute,
  validateRequestBody,
  createPaginatedResponse,
  parsePaginationParams,
  parseFilterParams,
  ProtectedAPIRouteHandler,
} from '../api-helpers';
import { prisma } from '../../db';
import { CreateUserData, UpdateUserData, CreateTeamData } from '../../types/rbac';

// Example 1: Basic protected route with custom permissions
export const GET = createProtectedRoute(async (request, context) => {
  const { user, accessScope, scopeFilter } = context;
  
  // This route requires authentication and will include user context
  return NextResponse.json({
    message: 'This is a protected route',
    user: {
      id: user.id,
      name: user.name,
      role: user.role?.name,
    },
    accessScope,
  });
}, {
  requiredPermission: {
    action: 'read',
    resource: 'users',
  },
  auditAction: 'access_protected_endpoint',
});

// Example 2: User management - Create user (Admin only)
export const createUserHandler: ProtectedAPIRouteHandler = async (request, context) => {
  const { user, scopeFilter } = context;
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateRequestBody<CreateUserData>(
      body,
      ['email', 'name', 'password'], // required fields
      ['roleId', 'teamId', 'isActive'] // optional fields
    );
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }
    
    const userData = validation.data!;
    
    // Create user using the existing auth service or direct Prisma call
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: userData.password, // Should be hashed in real implementation
        roleId: userData.roleId,
        teamId: userData.teamId,
        isActive: userData.isActive ?? true,
      },
      include: {
        role: true,
        team: true,
      },
    });
    
    // Remove password from response
    const { password, ...safeUser } = newUser;
    
    return NextResponse.json({
      message: 'User created successfully',
      user: safeUser,
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
};

export const POST_CreateUser = createUserManagementRoute(createUserHandler, 'create');

// Example 3: User management - List users with scope filtering
export const listUsersHandler: ProtectedAPIRouteHandler = async (request, context) => {
  const { user, accessScope, scopeFilter } = context;
  
  try {
    const { page, limit } = parsePaginationParams(request);
    const filters = parseFilterParams(request);
    
    // Build query with scope filtering
    const whereClause: any = {
      ...scopeFilter, // Apply scope-based filtering
    };
    
    // Apply additional filters
    if (filters.roleId) {
      whereClause.roleId = filters.roleId;
    }
    
    if (filters.teamId) {
      whereClause.teamId = filters.teamId;
    }
    
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive === 'true';
    }
    
    if (filters.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    
    // Get total count for pagination
    const total = await prisma.user.count({ where: whereClause });
    
    // Get users with pagination
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        role: true,
        team: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    
    // Remove passwords from response
    const safeUsers = users.map(({ password, ...user }) => user);
    
    return NextResponse.json(
      createPaginatedResponse(safeUsers, total, page, limit)
    );
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
};

export const GET_ListUsers = createUserManagementRoute(listUsersHandler, 'read');

// Example 4: User management - Update user
export const updateUserHandler: ProtectedAPIRouteHandler = async (request, context) => {
  const { user, params } = context;
  const userId = params?.id;
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateRequestBody<UpdateUserData>(
      body,
      [], // no required fields for update
      ['name', 'email', 'roleId', 'teamId', 'isActive'] // all optional
    );
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }
    
    const updateData = validation.data!;
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true,
        team: true,
      },
    });
    
    // Remove password from response
    const { password, ...safeUser } = updatedUser;
    
    return NextResponse.json({
      message: 'User updated successfully',
      user: safeUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
};

export const PUT_UpdateUser = createUserManagementRoute(updateUserHandler, 'update');

// Example 5: Self-profile management
export const updateOwnProfileHandler: ProtectedAPIRouteHandler = async (request, context) => {
  const { user } = context;
  
  try {
    const body = await request.json();
    
    // Validate request body (limited fields for self-update)
    const validation = validateRequestBody<{ name?: string; email?: string }>(
      body,
      [], // no required fields
      ['name', 'email'] // only allow name and email updates
    );
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }
    
    const updateData = validation.data!;
    
    // Update own profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: {
        role: true,
        team: true,
      },
    });
    
    // Remove password from response
    const { password, ...safeUser } = updatedUser;
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: safeUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
};

export const PUT_UpdateOwnProfile = createSelfProfileRoute(updateOwnProfileHandler);

// Example 6: Team management - Create team (Admin only)
export const createTeamHandler: ProtectedAPIRouteHandler = async (request, context) => {
  const { user } = context;
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateRequestBody<CreateTeamData>(
      body,
      ['name'], // required fields
      ['description'] // optional fields
    );
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }
    
    const teamData = validation.data!;
    
    // Create team
    const newTeam = await prisma.team.create({
      data: {
        name: teamData.name,
        description: teamData.description,
      },
    });
    
    return NextResponse.json({
      message: 'Team created successfully',
      team: newTeam,
    }, { status: 201 });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
};

export const POST_CreateTeam = createTeamManagementRoute(createTeamHandler, 'create');

// Example 7: Custom middleware configuration
export const customProtectedRoute = createProtectedRoute(async (request, context) => {
  const { user, accessScope } = context;
  
  // Custom business logic here
  return NextResponse.json({
    message: 'Custom protected route',
    customData: 'This route has custom middleware configuration',
  });
}, {
  // Custom configuration
  allowedRoles: ['Admin/Manager', 'Team Leader'], // Only these roles can access
  auditAction: 'access_custom_endpoint',
  skipAudit: false, // Enable audit logging
});

/**
 * Usage in actual API route files:
 * 
 * // app/api/users/route.ts
 * export { GET_ListUsers as GET, POST_CreateUser as POST } from '@/lib/rbac/examples/api-route-example';
 * 
 * // app/api/users/[id]/route.ts
 * export { PUT_UpdateUser as PUT } from '@/lib/rbac/examples/api-route-example';
 * 
 * // app/api/users/me/route.ts
 * export { PUT_UpdateOwnProfile as PUT } from '@/lib/rbac/examples/api-route-example';
 * 
 * // app/api/teams/route.ts
 * export { POST_CreateTeam as POST } from '@/lib/rbac/examples/api-route-example';
 */