import { prisma } from '../db';
import { TicketStatus } from '@prisma/client';
import { RoleType, UserWithRole } from '../types/rbac';
import { TICKET_PERMISSIONS } from '../rbac/permissions';
import { PermissionError } from '../rbac/errors';

// Types for feedback
export interface SubmitFeedbackData {
  ticketId: string;
  customerId: string;
  rating: number;
  comment?: string;
}

export interface TicketFeedback {
  id: string;
  ticketId: string;
  customerId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackSummary {
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  recentFeedback: TicketFeedback[];
}

// Custom errors
export class FeedbackAccessDeniedError extends PermissionError {
  constructor(userId: string, ticketId: string) {
    super(
      `Access denied to feedback for ticket ${ticketId} by user ${userId}`,
      'FEEDBACK_ACCESS_DENIED',
      'feedback:read',
      403
    );
  }
}

export class InvalidFeedbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFeedbackError';
  }
}

/**
 * Feedback Service
 * Manages customer feedback for tickets
 */
export class FeedbackService {
  /**
   * Get user with role information
   */
  private async getUserWithRole(userId: string): Promise<UserWithRole | null> {
    return await prisma.user.findUnique({
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

    return Array.from(new Set(teamIds)); // Remove duplicates
  }

  /**
   * Check if user can access feedback for a ticket
   */
  private async canAccessFeedback(userId: string, ticketId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    if (!user?.role) return false;

    const roleName = user.role.name as RoleType;
    const permissions = TICKET_PERMISSIONS[roleName];

    // Admin can access all feedback
    if (permissions.analytics.view === 'organization') {
      return true;
    }

    // Team Leader can access feedback for their team's tickets
    if (permissions.analytics.view === 'team') {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { teamId: true },
      });

      if (!ticket?.teamId) return false;

      const userTeamIds = await this.getUserTeamIds(userId);
      return userTeamIds.includes(ticket.teamId);
    }

    return false;
  }

  /**
   * Validate rating value
   */
  private validateRating(rating: number): void {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new InvalidFeedbackError('Rating must be an integer between 1 and 5');
    }
  }

  /**
   * Submit feedback for a ticket
   * Only customers can submit feedback, and only for resolved/closed tickets
   */
  async submitFeedback(data: SubmitFeedbackData): Promise<TicketFeedback> {
    // Validate rating
    this.validateRating(data.rating);

    // Check if ticket exists and is in valid state
    const ticket = await prisma.ticket.findUnique({
      where: { id: data.ticketId },
      select: {
        id: true,
        status: true,
        customerId: true,
        feedback: true,
      },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${data.ticketId}`);
    }

    // Verify the customer owns this ticket
    if (ticket.customerId !== data.customerId) {
      throw new InvalidFeedbackError('Customer can only submit feedback for their own tickets');
    }

    // Check if ticket is resolved or closed
    if (ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED) {
      throw new InvalidFeedbackError('Feedback can only be submitted for resolved or closed tickets');
    }

    // Check if feedback already exists
    if (ticket.feedback) {
      throw new InvalidFeedbackError('Feedback has already been submitted for this ticket');
    }

    // Create feedback
    const feedback = await prisma.ticketFeedback.create({
      data: {
        ticketId: data.ticketId,
        customerId: data.customerId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    return feedback;
  }

  /**
   * Get feedback for a specific ticket with access control
   */
  async getFeedback(ticketId: string, userId: string): Promise<TicketFeedback | null> {
    // Check access permission
    const canAccess = await this.canAccessFeedback(userId, ticketId);
    if (!canAccess) {
      throw new FeedbackAccessDeniedError(userId, ticketId);
    }

    // Get feedback
    const feedback = await prisma.ticketFeedback.findUnique({
      where: { ticketId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ticket: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return feedback;
  }

  /**
   * Get aggregated feedback summary with role-based filtering
   * Admin: all feedback, Team Leader: team feedback only
   */
  async getFeedbackSummary(
    userId: string,
    filters?: {
      teamId?: string;
      agentId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<FeedbackSummary> {
    const user = await this.getUserWithRole(userId);
    if (!user?.role) {
      throw new FeedbackAccessDeniedError(userId, 'summary');
    }

    const roleName = user.role.name as RoleType;
    const permissions = TICKET_PERMISSIONS[roleName];

    // Build query filters based on role
    const whereClause: any = {};

    // Date range filter
    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    // Role-based filtering
    if (permissions.analytics.view === 'organization') {
      // Admin can see all feedback
      if (filters?.teamId) {
        whereClause.ticket = { teamId: filters.teamId };
      }
      if (filters?.agentId) {
        whereClause.ticket = { ...whereClause.ticket, assignedTo: filters.agentId };
      }
    } else if (permissions.analytics.view === 'team') {
      // Team Leader can only see their team's feedback
      const userTeamIds = await this.getUserTeamIds(userId);
      
      if (filters?.teamId) {
        // Verify the requested team is one of their teams
        if (!userTeamIds.includes(filters.teamId)) {
          throw new FeedbackAccessDeniedError(userId, 'team feedback');
        }
        whereClause.ticket = { teamId: filters.teamId };
      } else {
        // Show all their teams' feedback
        whereClause.ticket = { teamId: { in: userTeamIds } };
      }

      if (filters?.agentId) {
        // Verify the agent is in one of their teams
        const agent = await prisma.user.findUnique({
          where: { id: filters.agentId },
          select: { teamId: true },
        });

        if (!agent?.teamId || !userTeamIds.includes(agent.teamId)) {
          throw new FeedbackAccessDeniedError(userId, 'agent feedback');
        }

        whereClause.ticket = { ...whereClause.ticket, assignedTo: filters.agentId };
      }
    } else {
      // User/Employee has no access to feedback summary
      throw new FeedbackAccessDeniedError(userId, 'summary');
    }

    // Get all feedback matching filters
    const allFeedback = await prisma.ticketFeedback.findMany({
      where: whereClause,
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            assignedTo: true,
            teamId: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const totalFeedback = allFeedback.length;
    const averageRating = totalFeedback > 0
      ? Math.round((allFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback) * 100) / 100
      : 0;

    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    allFeedback.forEach(f => {
      ratingDistribution[f.rating]++;
    });

    // Get recent feedback (last 10)
    const recentFeedback = allFeedback.slice(0, 10);

    return {
      totalFeedback,
      averageRating,
      ratingDistribution,
      recentFeedback,
    };
  }
}

// Export singleton instance
export const feedbackService = new FeedbackService();
