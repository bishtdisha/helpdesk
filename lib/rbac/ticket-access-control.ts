import { prisma } from '../db';
import { RoleType, UserWithRole } from '../types/rbac';
import { TICKET_PERMISSIONS, ROLE_TYPES, TicketAccessScope } from './permissions';
import { Ticket, TicketStatus } from '@prisma/client';

export type TicketAction = 'create' | 'read' | 'update' | 'delete' | 'assign' | 'close' | 'addFollower' | 'removeFollower';

export interface TicketQueryFilter {
  OR?: Array<{
    createdBy?: string;
    id?: { in: string[] };
    teamId?: { in: string[] };
  }>;
  createdBy?: string;
  id?: { in: string[] } | string;
  teamId?: { in: string[] } | string;
}

/**
 * Ticket Access Control Service
 * Handles role-based access control for ticket operations
 */
export class TicketAccessControl {
  // Cache for user data to avoid repeated DB queries within the same request
  private userCache: Map<string, { data: UserWithRole | null; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5000; // 5 seconds cache

  /**
   * Get user with role information (with in-memory caching)
   */
  private async getUserWithRole(userId: string): Promise<UserWithRole | null> {
    const cached = this.userCache.get(userId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    this.userCache.set(userId, { data: user, timestamp: now });
    
    // Clean old cache entries periodically
    if (this.userCache.size > 100) {
      for (const [key, value] of this.userCache.entries()) {
        if (now - value.timestamp > this.CACHE_TTL) {
          this.userCache.delete(key);
        }
      }
    }

    return user;
  }

  /**
   * Get ticket by ID
   */
  private async getTicket(ticketId: string): Promise<Ticket | null> {
    return await prisma.ticket.findUnique({
      where: { id: ticketId },
    });
  }

  /**
   * Get team IDs for a user (including teams they lead)
   */
  private async getUserTeamIds(userId: string): Promise<string[]> {
    const user = await this.getUserWithRole(userId);
    if (!user) return [];

    const teamIds: string[] = [];
    
    // Add user's own team
    if (user.teamId) {
      teamIds.push(user.teamId);
    }

    // Add teams the user leads
    if (user.teamLeaderships && user.teamLeaderships.length > 0) {
      teamIds.push(...user.teamLeaderships.map(tl => tl.teamId));
    }

    return [...new Set(teamIds)]; // Remove duplicates
  }

  /**
   * Check if user is a follower of a ticket
   */
  private async isTicketFollower(ticketId: string, userId: string): Promise<boolean> {
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
   * Get ticket IDs that a user is following
   */
  private async getFollowedTicketIds(userId: string): Promise<string[]> {
    const followers = await prisma.ticketFollower.findMany({
      where: { userId },
      select: { ticketId: true },
    });
    return followers.map(f => f.ticketId);
  }

  /**
   * Check if user is in a specific team
   */
  private async isUserInTeam(userId: string, teamId: string): Promise<boolean> {
    const teamIds = await this.getUserTeamIds(userId);
    return teamIds.includes(teamId);
  }

  /**
   * Determine if user can access a specific ticket
   */
  async canAccessTicket(userId: string, ticketId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    const ticket = await this.getTicket(ticketId);

    if (!user || !ticket) return false;

    const roleName = user.role?.name as RoleType;
    if (!roleName) return false;

    switch (roleName) {
      case ROLE_TYPES.ADMIN_MANAGER:
        return true; // Full access to all tickets

      case ROLE_TYPES.TEAM_LEADER:
        // Can access if ticket belongs to their team
        if (!ticket.teamId) return false;
        const leaderTeams = await this.getUserTeamIds(userId);
        return leaderTeams.includes(ticket.teamId);

      case ROLE_TYPES.USER_EMPLOYEE:
        // Can access if they created it, are assigned to it, or are a follower
        if (ticket.createdBy === userId) return true;
        if (ticket.assignedTo === userId) return true;
        const isFollower = await this.isTicketFollower(ticketId, userId);
        return isFollower;

      default:
        return false;
    }
  }

  /**
   * Get ticket list filters based on user role
   * Returns Prisma where clause for filtering tickets
   */
  async getTicketFilters(userId: string): Promise<TicketQueryFilter> {
    const user = await this.getUserWithRole(userId);

    if (!user?.role) {
      throw new Error('User role not found');
    }

    const roleName = user.role.name as RoleType;

    switch (roleName) {
      case ROLE_TYPES.ADMIN_MANAGER:
        return {}; // No filters - see all tickets

      case ROLE_TYPES.TEAM_LEADER:
        const teamIds = await this.getUserTeamIds(userId);
        if (teamIds.length === 0) {
          return { id: 'impossible' }; // No teams, no tickets
        }
        return { teamId: { in: teamIds } };

      case ROLE_TYPES.USER_EMPLOYEE:
        // Only tickets they created, are assigned to, or are following
        // Use a subquery approach to avoid fetching all followed ticket IDs
        return {
          OR: [
            { createdBy: userId },
            { assignedTo: userId },
            { followers: { some: { userId } } },
          ],
        };

      default:
        return { id: 'impossible' }; // Return no results
    }
  }

  /**
   * Check if user can perform a specific action on a ticket
   */
  async canPerformAction(
    userId: string,
    ticketId: string,
    action: TicketAction
  ): Promise<boolean> {
    const canAccess = await this.canAccessTicket(userId, ticketId);
    if (!canAccess) return false;

    const user = await this.getUserWithRole(userId);
    const ticket = await this.getTicket(ticketId);

    if (!user?.role || !ticket) return false;

    const roleName = user.role.name as RoleType;
    const permissions = TICKET_PERMISSIONS[roleName];

    switch (action) {
      case 'create':
        return permissions.tickets.create;

      case 'read':
        // Already checked by canAccessTicket
        return true;

      case 'update':
        if (permissions.tickets.update === 'all') return true;
        if (permissions.tickets.update === 'team') {
          return ticket.teamId ? await this.isUserInTeam(userId, ticket.teamId) : false;
        }
        if (permissions.tickets.update === 'own') {
          return ticket.createdBy === userId;
        }
        return false;

      case 'assign':
        if (permissions.tickets.assign === 'all') return true;
        if (permissions.tickets.assign === 'team') {
          return ticket.teamId ? await this.isUserInTeam(userId, ticket.teamId) : false;
        }
        return false;

      case 'close':
        if (permissions.tickets.close === 'all') return true;
        if (permissions.tickets.close === 'team') {
          return ticket.teamId ? await this.isUserInTeam(userId, ticket.teamId) : false;
        }
        return false;

      case 'delete':
        return permissions.tickets.delete === true;

      case 'addFollower':
        if (permissions.followers.add === 'all') return true;
        if (permissions.followers.add === 'team') {
          return ticket.teamId ? await this.isUserInTeam(userId, ticket.teamId) : false;
        }
        return false;

      case 'removeFollower':
        if (permissions.followers.remove === 'all') return true;
        if (permissions.followers.remove === 'team') {
          return ticket.teamId ? await this.isUserInTeam(userId, ticket.teamId) : false;
        }
        if (permissions.followers.remove === 'own') {
          // User can remove themselves as a follower
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if user can assign ticket to a specific assignee
   */
  async canAssignToUser(
    userId: string,
    ticketId: string,
    assigneeId: string
  ): Promise<boolean> {
    const canAssign = await this.canPerformAction(userId, ticketId, 'assign');
    if (!canAssign) return false;

    const user = await this.getUserWithRole(userId);
    const ticket = await this.getTicket(ticketId);
    const assignee = await this.getUserWithRole(assigneeId);

    if (!user?.role || !ticket || !assignee) return false;

    const roleName = user.role.name as RoleType;

    switch (roleName) {
      case ROLE_TYPES.ADMIN_MANAGER:
        // Admin can assign to anyone
        return true;

      case ROLE_TYPES.TEAM_LEADER:
        // Team Leader can only assign to members of their teams
        if (!ticket.teamId) return false;
        const leaderTeams = await this.getUserTeamIds(userId);
        if (!leaderTeams.includes(ticket.teamId)) return false;
        
        // Check if assignee is in the same team
        return assignee.teamId === ticket.teamId;

      default:
        return false;
    }
  }

  /**
   * Get valid status transitions for a given status
   */
  getValidStatusTransitions(currentStatus: TicketStatus): TicketStatus[] {
    const validTransitions: Record<TicketStatus, TicketStatus[]> = {
      OPEN: ['IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'CLOSED'],
      IN_PROGRESS: ['WAITING_FOR_CUSTOMER', 'RESOLVED', 'OPEN', 'CLOSED'],
      WAITING_FOR_CUSTOMER: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      RESOLVED: ['CLOSED', 'IN_PROGRESS', 'OPEN'],
      CLOSED: ['IN_PROGRESS', 'OPEN'], // Can reopen if needed
    };

    return validTransitions[currentStatus] ?? [];
  }

  /**
   * Validate ticket status transition
   */
  validateStatusTransition(
    currentStatus: TicketStatus,
    newStatus: TicketStatus
  ): boolean {
    const validTransitions = this.getValidStatusTransitions(currentStatus);
    return validTransitions.includes(newStatus);
  }
}

// Export singleton instance
export const ticketAccessControl = new TicketAccessControl();
