import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { permissionEngine } from '@/lib/rbac/permission-engine';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '@/lib/rbac/permissions';

/**
 * POST /api/users/[id]/soft-delete - Soft delete a user
 * 
 * Marks user as deleted without removing from database.
 * Preserves all relationships and historical data.
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

    // Check if user has permission to delete users
    const hasPermission = await permissionEngine.checkPermission(
      currentUser.id,
      PERMISSION_ACTIONS.DELETE,
      RESOURCE_TYPES.USERS
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          message: 'You do not have permission to delete users',
        },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return NextResponse.json(
        {
          error: 'Cannot delete self',
          message: 'You cannot delete your own account',
        },
        { status: 400 }
      );
    }

    // Get user to delete with relationships
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedTickets: {
          where: {
            status: { in: ['OPEN', 'IN_PROGRESS'] }
          }
        },
        teamLeaderships: {
          include: {
            team: true
          }
        },
        role: true,
        team: true
      }
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already deleted
    if (userToDelete.isDeleted) {
      return NextResponse.json(
        {
          error: 'User already deleted',
          message: 'This user has already been deleted',
        },
        { status: 400 }
      );
    }

    // Pre-deletion checks
    const checks = {
      openTickets: userToDelete.assignedTickets.length,
      teamLeaderships: userToDelete.teamLeaderships.length,
      canDelete: true,
      warnings: [] as string[]
    };

    // Check for open tickets
    if (checks.openTickets > 0) {
      checks.canDelete = false;
      checks.warnings.push(
        `User has ${checks.openTickets} open ticket(s) assigned. Please reassign them first.`
      );
    }

    // Check for team leadership
    if (checks.teamLeaderships > 0) {
      checks.canDelete = false;
      const teamNames = userToDelete.teamLeaderships.map(tl => tl.team.name).join(', ');
      checks.warnings.push(
        `User is a team leader of: ${teamNames}. Please assign new leader(s) first.`
      );
    }

    // If checks fail, return warnings
    if (!checks.canDelete) {
      return NextResponse.json(
        {
          error: 'Cannot delete user',
          message: 'User has active responsibilities that must be handled first',
          checks,
        },
        { status: 400 }
      );
    }

    // Perform soft delete
    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: currentUser.id,
        isActive: false,
        // Anonymize personal data for privacy
        name: `Deleted User (${userId.slice(0, 8)})`,
        email: `deleted_${userId}@deleted.local`,
        password: 'DELETED',
        // Remove from team
        teamId: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isDeleted: true,
        deletedAt: true,
      }
    });

    // Unassign from any remaining tickets (shouldn't be any open ones)
    await prisma.ticket.updateMany({
      where: { assignedTo: userId },
      data: { assignedTo: null }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'SOFT_DELETE_USER',
        resourceType: 'USER',
        resourceId: userId,
        success: true,
        details: {
          deletedUserEmail: userToDelete.email,
          deletedUserName: userToDelete.name,
          deletedBy: currentUser.email,
          reason: 'Admin soft delete',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User soft deleted successfully',
      user: deletedUser,
    });

  } catch (error) {
    console.error('Error soft deleting user:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to delete user',
      },
      { status: 500 }
    );
  }
}
