import { prisma } from '../db';
import { User, TicketFollower, Ticket } from '@prisma/client';
import { ticketAccessControl } from '../rbac/ticket-access-control';
import { PermissionError } from '../rbac/errors';

// Custom errors
export class FollowerNotFoundError extends Error {
  constructor(ticketId: string, userId: string) {
    super(`Follower not found for ticket ${ticketId} and user ${userId}`);
    this.name = 'FollowerNotFoundError';
  }
}

export class FollowerAlreadyExistsError extends Error {
  constructor(ticketId: string, userId: string) {
    super(`User ${userId} is already a follower of ticket ${ticketId}`);
    this.name = 'FollowerAlreadyExistsError';
  }
}

export class FollowerPermissionDeniedError extends PermissionError {
  constructor(action: string, reason: string) {
    super(
      `Cannot ${action} follower: ${reason}`,
      'FOLLOWER_PERMISSION_DENIED',
      'tickets:followers',
      403
    );
  }
}

// Type for follower with user details
export interface FollowerWithUser extends TicketFollower {
  user: Pick<User, 'id' | 'name' | 'email'>;
}

// Type for ticket with follower count
export interface TicketWithFollowerCount extends Ticket {
  _count?: {
    followers: number;
  };
}

/**
 * Follower Service
 * Manages ticket follower relationships with role-based access control
 */
export class FollowerService {
  /**
   * Add a follower to a ticket
   * Permissions:
   * - Admin: Can add anyone to any ticket
   * - Team Leader: Can add anyone to team tickets
   * - User/Employee: Cannot add followers
   */
  async addFollower(
    ticketId: string,
    userIdToAdd: string,
    addedBy: string
  ): Promise<FollowerWithUser> {
    // Check if the person adding has permission
    const canAddFollower = await ticketAccessControl.canPerformAction(
      addedBy,
      ticketId,
      'addFollower'
    );

    if (!canAddFollower) {
      throw new FollowerPermissionDeniedError(
        'add',
        'You do not have permission to add followers to this ticket'
      );
    }

    // Verify the ticket exists and user has access to it
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    // Verify the user to add exists
    const userToAdd = await prisma.user.findUnique({
      where: { id: userIdToAdd },
    });

    if (!userToAdd) {
      throw new Error(`User not found: ${userIdToAdd}`);
    }

    // Check if already a follower
    const existingFollower = await prisma.ticketFollower.findUnique({
      where: {
        ticketId_userId: {
          ticketId,
          userId: userIdToAdd,
        },
      },
    });

    if (existingFollower) {
      throw new FollowerAlreadyExistsError(ticketId, userIdToAdd);
    }

    // Add the follower
    const follower = await prisma.ticketFollower.create({
      data: {
        ticketId,
        userId: userIdToAdd,
        addedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create history entry
    await this.createFollowerHistoryEntry(
      ticketId,
      addedBy,
      'follower_added',
      userIdToAdd
    );

    return follower;
  }

  /**
   * Remove a follower from a ticket
   * Permissions:
   * - Admin: Can remove anyone from any ticket
   * - Team Leader: Can remove anyone from team tickets
   * - User/Employee: Can only remove themselves
   */
  async removeFollower(
    ticketId: string,
    userIdToRemove: string,
    removedBy: string
  ): Promise<void> {
    // Check if the follower exists
    const existingFollower = await prisma.ticketFollower.findUnique({
      where: {
        ticketId_userId: {
          ticketId,
          userId: userIdToRemove,
        },
      },
    });

    if (!existingFollower) {
      throw new FollowerNotFoundError(ticketId, userIdToRemove);
    }

    // Check permissions
    const canRemoveFollower = await ticketAccessControl.canPerformAction(
      removedBy,
      ticketId,
      'removeFollower'
    );

    if (!canRemoveFollower) {
      throw new FollowerPermissionDeniedError(
        'remove',
        'You do not have permission to remove followers from this ticket'
      );
    }

    // Additional check: User/Employee can only remove themselves
    const remover = await prisma.user.findUnique({
      where: { id: removedBy },
      include: { role: true },
    });

    if (remover?.role?.name === 'User/Employee' && userIdToRemove !== removedBy) {
      throw new FollowerPermissionDeniedError(
        'remove',
        'You can only remove yourself as a follower'
      );
    }

    // Remove the follower
    await prisma.ticketFollower.delete({
      where: {
        ticketId_userId: {
          ticketId,
          userId: userIdToRemove,
        },
      },
    });

    // Create history entry
    await this.createFollowerHistoryEntry(
      ticketId,
      removedBy,
      'follower_removed',
      userIdToRemove
    );
  }

  /**
   * Get all followers of a ticket
   * User must have access to the ticket to see its followers
   */
  async getFollowers(
    ticketId: string,
    requesterId: string
  ): Promise<FollowerWithUser[]> {
    // Check if user can access this ticket
    const canAccess = await ticketAccessControl.canAccessTicket(requesterId, ticketId);

    if (!canAccess) {
      throw new FollowerPermissionDeniedError(
        'view',
        'You do not have permission to view followers of this ticket'
      );
    }

    const followers = await prisma.ticketFollower.findMany({
      where: { ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        addedAt: 'asc',
      },
    });

    return followers;
  }

  /**
   * Get all tickets that a user is following
   */
  async getFollowedTickets(userId: string): Promise<Ticket[]> {
    const followers = await prisma.ticketFollower.findMany({
      where: { userId },
      include: {
        ticket: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                comments: true,
                attachments: true,
                followers: true,
              },
            },
          },
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    return followers.map(f => f.ticket);
  }

  /**
   * Check if a user is a follower of a ticket
   */
  async isFollower(ticketId: string, userId: string): Promise<boolean> {
    const follower = await prisma.ticketFollower.findUnique({
      where: {
        ticketId_userId: {
          ticketId,
          userId,
        },
      },
    });

    return !!follower;
  }

  /**
   * Get follower count for a ticket
   */
  async getFollowerCount(ticketId: string): Promise<number> {
    return await prisma.ticketFollower.count({
      where: { ticketId },
    });
  }

  /**
   * Get follower counts for multiple tickets
   */
  async getFollowerCounts(ticketIds: string[]): Promise<Record<string, number>> {
    const counts = await prisma.ticketFollower.groupBy({
      by: ['ticketId'],
      where: {
        ticketId: { in: ticketIds },
      },
      _count: {
        ticketId: true,
      },
    });

    const result: Record<string, number> = {};
    counts.forEach(count => {
      result[count.ticketId] = count._count.ticketId;
    });

    return result;
  }

  /**
   * Create a history entry for follower operations
   */
  private async createFollowerHistoryEntry(
    ticketId: string,
    userId: string,
    action: string,
    affectedUserId: string
  ): Promise<void> {
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        userId,
        action,
        fieldName: 'followers',
        oldValue: null,
        newValue: affectedUserId,
      },
    });
  }
}

// Export singleton instance
export const followerService = new FollowerService();
