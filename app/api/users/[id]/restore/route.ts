import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { permissionEngine } from '@/lib/rbac/permission-engine';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '@/lib/rbac/permissions';

/**
 * POST /api/users/[id]/restore - Restore a soft-deleted user
 * 
 * Restores a previously soft-deleted user.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = params.id;

    // Check if user has permission to manage users
    const hasPermission = await permissionEngine.checkPermission(
      currentUser.id,
      PERMISSION_ACTIONS.CREATE,
      RESOURCE_TYPES.USERS
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          message: 'You do not have permission to restore users',
        },
        { status: 403 }
      );
    }

    // Get user to restore
    const userToRestore = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToRestore) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is actually deleted
    if (!userToRestore.isDeleted) {
      return NextResponse.json(
        {
          error: 'User not deleted',
          message: 'This user is not deleted and cannot be restored',
        },
        { status: 400 }
      );
    }

    // Check if email is available (in case it was reused)
    const originalEmail = userToRestore.email.replace('deleted_', '').replace('@deleted.local', '');
    const emailInUse = await prisma.user.findFirst({
      where: {
        email: originalEmail,
        id: { not: userId }
      }
    });

    if (emailInUse) {
      return NextResponse.json(
        {
          error: 'Email in use',
          message: 'Cannot restore: email address is already in use by another user',
        },
        { status: 400 }
      );
    }

    // Restore user
    const restoredUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        isActive: true,
        // Note: Name, email, and password need to be manually reset by admin
      },
      select: {
        id: true,
        email: true,
        name: true,
        isDeleted: true,
        isActive: true,
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'RESTORE_USER',
        resourceType: 'USER',
        resourceId: userId,
        success: true,
        details: {
          restoredBy: currentUser.email,
          reason: 'Admin restore',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User restored successfully. Please update their email and password.',
      user: restoredUser,
    });

  } catch (error) {
    console.error('Error restoring user:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to restore user',
      },
      { status: 500 }
    );
  }
}
