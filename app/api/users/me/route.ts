import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { permissionEngine } from '@/lib/rbac/permission-engine';
import {
  UpdateOwnProfileData,
  SafeUserWithRole,
} from '@/lib/types/rbac';
import {
  ValidationError,
} from '@/lib/rbac/errors';
import bcrypt from 'bcrypt';

/**
 * GET /api/users/me - Get current user profile
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

    // Get user with complete role and team information
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
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
          message: 'Current user not found in database',
        },
        { status: 404 }
      );
    }

    // Get user permissions for additional context
    const userPermissions = await permissionEngine.getUserPermissions(user.id);

    // Remove password from response
    const { password, ...safeUser } = user;

    return NextResponse.json({
      user: safeUser as SafeUserWithRole,
      permissions: userPermissions,
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/me - Update own profile
 * 
 * Request body:
 * - name: User's full name (optional)
 * - email: User's email address (optional)
 * - password: New password (optional)
 * - currentPassword: Current password (required if changing password)
 */
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get current user with password for verification
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
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
          message: 'Current user not found in database',
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      currentPassword 
    }: UpdateOwnProfileData & { password?: string; currentPassword?: string } = body;

    // Validate email format if provided
    if (email && email !== user.email) {
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

      if (existingUser && existingUser.id !== user.id) {
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

    // Validate password change if requested
    if (password !== undefined) {
      if (!currentPassword) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Current password is required to change password',
          },
          { status: 400 }
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Current password is incorrect',
          },
          { status: 400 }
        );
      }

      // Validate new password strength
      if (password.length < 8) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Password must be at least 8 characters long',
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    
    if (password !== undefined) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'No changes provided',
        },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
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
      message: 'Profile updated successfully',
      user: safeUser as SafeUserWithRole,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    
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