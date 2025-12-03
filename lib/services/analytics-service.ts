import { prisma } from '../db';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { RoleType, UserWithRole } from '../types/rbac';
import { ROLE_TYPES, TICKET_PERMISSIONS } from '../rbac/permissions';
import { PermissionError } from '../rbac/errors';

// Types for analytics
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface OrganizationMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResolutionTime: number; // in hours
  averageResponseTime: number; // in hours
  customerSatisfactionScore: number;
  slaComplianceRate: number;
  ticketsByPriority: Record<TicketPriority, number>;
  ticketsByStatus: Record<TicketStatus, number>;
  teamPerformance: TeamPerformanceSummary[];
  trendData: TrendDataPoint[];
}

export interface TeamMetrics {
  teamId: string;
  teamName: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResolutionTime: number;
  averageResponseTime: number;
  customerSatisfactionScore: number;
  slaComplianceRate: number;
  agentPerformance: AgentPerformanceSummary[];
  workloadDistribution: WorkloadData[];
}

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  assignedTickets: number;
  resolvedTickets: number;
  openTickets: number;
  averageResolutionTime: number;
  averageResponseTime: number;
  customerSatisfactionScore: number;
  slaComplianceRate: number;
}

export interface TeamPerformanceSummary {
  teamId: string;
  teamName: string;
  totalTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  slaComplianceRate: number;
}

export interface AgentPerformanceSummary {
  agentId: string;
  agentName: string;
  assignedTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
}

export interface WorkloadData {
  agentId: string;
  agentName: string;
  openTickets: number;
  inProgressTickets: number;
  totalAssigned: number;
}

export interface TrendDataPoint {
  date: string;
  totalTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
}

export interface ComparativeAnalysis {
  teamRankings: TeamRanking[];
  performanceTrends: PerformanceTrend[];
  outliers: PerformanceOutlier[];
  executiveSummary: ExecutiveSummary;
}

export interface TeamRanking {
  rank: number;
  teamId: string;
  teamName: string;
  score: number;
  metrics: {
    resolutionTime: number;
    slaCompliance: number;
    customerSatisfaction: number;
    ticketVolume: number;
  };
}

export interface PerformanceTrend {
  teamId: string;
  teamName: string;
  trend: 'improving' | 'declining' | 'stable';
  changePercentage: number;
  metric: string;
}

export interface PerformanceOutlier {
  type: 'high_performer' | 'needs_attention';
  entityType: 'team' | 'agent';
  entityId: string;
  entityName: string;
  metric: string;
  value: number;
  deviation: number;
}

export interface ExecutiveSummary {
  totalTickets: number;
  overallResolutionTime: number;
  overallSLACompliance: number;
  overallCustomerSatisfaction: number;
  topPerformingTeam: string;
  areasForImprovement: string[];
}

// Custom errors
export class AnalyticsAccessDeniedError extends PermissionError {
  constructor(userId: string, scope: string) {
    super(
      `Access denied to ${scope} analytics for user ${userId}`,
      'ANALYTICS_ACCESS_DENIED',
      'analytics:read',
      403
    );
  }
}

/**
 * Analytics Service
 * Provides role-scoped performance metrics and reporting
 */
export class AnalyticsService {
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

    return [...new Set(teamIds)]; // Remove duplicates
  }

  /**
   * Check if user has access to organization-wide analytics
   */
  private async canAccessOrganizationAnalytics(userId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    if (!user?.role) return false;

    const roleName = user.role.name as RoleType;
    const permissions = TICKET_PERMISSIONS[roleName];
    
    return permissions.analytics.view === 'organization';
  }

  /**
   * Check if user has access to team analytics
   */
  private async canAccessTeamAnalytics(userId: string, teamId?: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    if (!user?.role) return false;

    const roleName = user.role.name as RoleType;
    const permissions = TICKET_PERMISSIONS[roleName];
    
    if (permissions.analytics.view === 'organization') return true;
    if (permissions.analytics.view === 'team') {
      if (!teamId) return true; // Can access their own teams
      const userTeamIds = await this.getUserTeamIds(userId);
      return userTeamIds.includes(teamId);
    }
    
    return false;
  }

  /**
   * Calculate average time difference in hours
   */
  private calculateAverageHours(dates: Array<{ start: Date | null; end: Date | null }>): number {
    const validDates = dates.filter(d => d.start && d.end);
    if (validDates.length === 0) return 0;

    const totalHours = validDates.reduce((sum, d) => {
      const diff = d.end!.getTime() - d.start!.getTime();
      return sum + (diff / (1000 * 60 * 60)); // Convert to hours
    }, 0);

    return Math.round((totalHours / validDates.length) * 100) / 100;
  }

  /**
   * Get organization-wide metrics (Admin only)
   */
  async getOrganizationMetrics(userId: string, dateRange: DateRange): Promise<OrganizationMetrics> {
    // Check permission
    const canAccess = await this.canAccessOrganizationAnalytics(userId);
    if (!canAccess) {
      throw new AnalyticsAccessDeniedError(userId, 'organization');
    }

    // Build date filter
    const dateFilter = {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    };

    // Get total ticket counts
    const totalTickets = await prisma.ticket.count({
      where: dateFilter,
    });

    const openTickets = await prisma.ticket.count({
      where: {
        ...dateFilter,
        status: TicketStatus.OPEN,
      },
    });

    const resolvedTickets = await prisma.ticket.count({
      where: {
        ...dateFilter,
        status: TicketStatus.RESOLVED,
      },
    });

    const closedTickets = await prisma.ticket.count({
      where: {
        ...dateFilter,
        status: TicketStatus.CLOSED,
      },
    });

    // Calculate average resolution time
    const resolvedTicketsData = await prisma.ticket.findMany({
      where: {
        ...dateFilter,
        status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    const averageResolutionTime = this.calculateAverageHours(
      resolvedTicketsData.map(t => ({ start: t.createdAt, end: t.resolvedAt }))
    );

    // Calculate average response time (simplified - using updatedAt as proxy)
    const averageResponseTime = 0; // Simplified for now

    // Calculate customer satisfaction score (simplified)
    const customerSatisfactionScore = 0; // Simplified for now - no feedback data yet

    // Calculate SLA compliance rate
    const ticketsWithSLA = await prisma.ticket.findMany({
      where: {
        ...dateFilter,
        slaDueAt: { not: null },
        status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      },
      select: {
        slaDueAt: true,
        resolvedAt: true,
      },
    });

    const slaCompliantCount = ticketsWithSLA.filter(
      t => t.resolvedAt && t.slaDueAt && t.resolvedAt <= t.slaDueAt
    ).length;

    const slaComplianceRate = ticketsWithSLA.length > 0
      ? Math.round((slaCompliantCount / ticketsWithSLA.length) * 10000) / 100
      : 0;

    // Get tickets by priority
    const ticketsByPriority = await prisma.ticket.groupBy({
      by: ['priority'],
      where: dateFilter,
      _count: true,
    });

    const priorityMap: Record<TicketPriority, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    ticketsByPriority.forEach(item => {
      priorityMap[item.priority] = item._count;
    });

    // Get tickets by status
    const ticketsByStatus = await prisma.ticket.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: true,
    });

    const statusMap: Record<TicketStatus, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      WAITING_FOR_CUSTOMER: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };

    ticketsByStatus.forEach(item => {
      statusMap[item.status] = item._count;
    });

    // Get team performance summaries
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const teamPerformance: TeamPerformanceSummary[] = [];

    for (const team of teams) {
      const teamTickets = await prisma.ticket.count({
        where: {
          ...dateFilter,
          teamId: team.id,
        },
      });

      const teamResolved = await prisma.ticket.count({
        where: {
          ...dateFilter,
          teamId: team.id,
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
      });

      const teamResolvedData = await prisma.ticket.findMany({
        where: {
          ...dateFilter,
          teamId: team.id,
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      });

      const teamAvgResolutionTime = this.calculateAverageHours(
        teamResolvedData.map(t => ({ start: t.createdAt, end: t.resolvedAt }))
      );

      const teamTicketsWithSLA = await prisma.ticket.findMany({
        where: {
          ...dateFilter,
          teamId: team.id,
          slaDueAt: { not: null },
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
        select: {
          slaDueAt: true,
          resolvedAt: true,
        },
      });

      const teamSLACompliant = teamTicketsWithSLA.filter(
        t => t.resolvedAt && t.slaDueAt && t.resolvedAt <= t.slaDueAt
      ).length;

      const teamSLARate = teamTicketsWithSLA.length > 0
        ? Math.round((teamSLACompliant / teamTicketsWithSLA.length) * 10000) / 100
        : 0;

      teamPerformance.push({
        teamId: team.id,
        teamName: team.name,
        totalTickets: teamTickets,
        resolvedTickets: teamResolved,
        averageResolutionTime: teamAvgResolutionTime,
        slaComplianceRate: teamSLARate,
      });
    }

    // Generate trend data (daily aggregates)
    const trendData: TrendDataPoint[] = [];
    const daysDiff = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Limit to 30 data points for performance
    const interval = Math.max(1, Math.floor(daysDiff / 30));

    for (let i = 0; i < daysDiff; i += interval) {
      const date = new Date(dateRange.startDate);
      date.setDate(date.getDate() + i);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + interval);

      const dayTickets = await prisma.ticket.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      const dayResolved = await prisma.ticket.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
      });

      const dayResolvedData = await prisma.ticket.findMany({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      });

      const dayAvgResolutionTime = this.calculateAverageHours(
        dayResolvedData.map(t => ({ start: t.createdAt, end: t.resolvedAt }))
      );

      trendData.push({
        date: date.toISOString().split('T')[0],
        totalTickets: dayTickets,
        resolvedTickets: dayResolved,
        averageResolutionTime: dayAvgResolutionTime,
      });
    }

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      closedTickets,
      averageResolutionTime,
      averageResponseTime,
      customerSatisfactionScore,
      slaComplianceRate,
      ticketsByPriority: priorityMap,
      ticketsByStatus: statusMap,
      teamPerformance,
      trendData,
    };
  }

  /**
   * Get team-specific metrics with access validation
   */
  async getTeamMetrics(teamId: string, userId: string, dateRange: DateRange): Promise<TeamMetrics> {
    // Check permission
    const canAccess = await this.canAccessTeamAnalytics(userId, teamId);
    if (!canAccess) {
      throw new AnalyticsAccessDeniedError(userId, 'team');
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    // Build date filter
    const dateFilter = {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
      teamId,
    };

    // Get ticket counts
    const totalTickets = await prisma.ticket.count({
      where: dateFilter,
    });

    const openTickets = await prisma.ticket.count({
      where: {
        ...dateFilter,
        status: TicketStatus.OPEN,
      },
    });

    const resolvedTickets = await prisma.ticket.count({
      where: {
        ...dateFilter,
        status: TicketStatus.RESOLVED,
      },
    });

    const closedTickets = await prisma.ticket.count({
      where: {
        ...dateFilter,
        status: TicketStatus.CLOSED,
      },
    });

    // Calculate average resolution time
    const resolvedTicketsData = await prisma.ticket.findMany({
      where: {
        ...dateFilter,
        status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    const averageResolutionTime = this.calculateAverageHours(
      resolvedTicketsData.map(t => ({ start: t.createdAt, end: t.resolvedAt }))
    );

    // Calculate average response time
    const assignedTicketsData = await prisma.ticket.findMany({
      where: {
        ...dateFilter,
        assignedTo: { not: null },
      },
      select: {
        createdAt: true,
        history: {
          where: {
            action: 'assigned',
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
        },
      },
    });

    const averageResponseTime = this.calculateAverageHours(
      assignedTicketsData
        .filter(t => t.history.length > 0)
        .map(t => ({ start: t.createdAt, end: t.history[0].createdAt }))
    );

    // Calculate SLA compliance rate
    const ticketsWithSLA = await prisma.ticket.findMany({
      where: {
        ...dateFilter,
        slaDueAt: { not: null },
        status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      },
      select: {
        slaDueAt: true,
        resolvedAt: true,
      },
    });

    const slaCompliantCount = ticketsWithSLA.filter(
      t => t.resolvedAt && t.slaDueAt && t.resolvedAt <= t.slaDueAt
    ).length;

    const slaComplianceRate = ticketsWithSLA.length > 0
      ? Math.round((slaCompliantCount / ticketsWithSLA.length) * 10000) / 100
      : 0;

    // Calculate customer satisfaction score
    const teamFeedbackData = await prisma.ticketFeedback.findMany({
      where: {
        ticket: dateFilter,
      },
      select: {
        rating: true,
      },
    });

    const customerSatisfactionScore = teamFeedbackData.length > 0
      ? Math.round((teamFeedbackData.reduce((sum, f) => sum + f.rating, 0) / teamFeedbackData.length) * 100) / 100
      : 0;

    // Get team members
    const teamMembers = await prisma.user.findMany({
      where: {
        teamId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Generate agent performance summaries
    const agentPerformance: AgentPerformanceSummary[] = [];

    for (const member of teamMembers) {
      const agentAssigned = await prisma.ticket.count({
        where: {
          ...dateFilter,
          assignedTo: member.id,
        },
      });

      const agentResolved = await prisma.ticket.count({
        where: {
          ...dateFilter,
          assignedTo: member.id,
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
      });

      const agentResolvedData = await prisma.ticket.findMany({
        where: {
          ...dateFilter,
          assignedTo: member.id,
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      });

      const agentAvgResolutionTime = this.calculateAverageHours(
        agentResolvedData.map(t => ({ start: t.createdAt, end: t.resolvedAt }))
      );

      agentPerformance.push({
        agentId: member.id,
        agentName: member.name || 'Unknown',
        assignedTickets: agentAssigned,
        resolvedTickets: agentResolved,
        averageResolutionTime: agentAvgResolutionTime,
      });
    }

    // Calculate workload distribution
    const workloadDistribution: WorkloadData[] = [];

    for (const member of teamMembers) {
      const openCount = await prisma.ticket.count({
        where: {
          teamId,
          assignedTo: member.id,
          status: TicketStatus.OPEN,
        },
      });

      const inProgressCount = await prisma.ticket.count({
        where: {
          teamId,
          assignedTo: member.id,
          status: TicketStatus.IN_PROGRESS,
        },
      });

      const totalAssigned = await prisma.ticket.count({
        where: {
          teamId,
          assignedTo: member.id,
          status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_CUSTOMER] },
        },
      });

      workloadDistribution.push({
        agentId: member.id,
        agentName: member.name || 'Unknown',
        openTickets: openCount,
        inProgressTickets: inProgressCount,
        totalAssigned,
      });
    }

    return {
      teamId: team.id,
      teamName: team.name,
      totalTickets,
      openTickets,
      resolvedTickets,
      closedTickets,
      averageResolutionTime,
      averageResponseTime,
      customerSatisfactionScore,
      slaComplianceRate,
      agentPerformance,
      workloadDistribution,
    };
  }

  /**
   * Get agent-specific performance metrics with access control
   */
  async getAgentMetrics(agentId: string, userId: string, dateRange: DateRange): Promise<AgentMetrics> {
    // Get the agent
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        teamId: true,
      },
    });

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Check permission - Admin can view all, Team Leader can view team members only
    const user = await this.getUserWithRole(userId);
    if (!user?.role) {
      throw new AnalyticsAccessDeniedError(userId, 'agent');
    }

    const roleName = user.role.name as RoleType;
    const permissions = TICKET_PERMISSIONS[roleName];

    if (permissions.analytics.view === 'none') {
      throw new AnalyticsAccessDeniedError(userId, 'agent');
    }

    if (permissions.analytics.view === 'team') {
      // Team Leader can only view agents in their teams
      if (!agent.teamId) {
        throw new AnalyticsAccessDeniedError(userId, 'agent');
      }
      
      const userTeamIds = await this.getUserTeamIds(userId);
      if (!userTeamIds.includes(agent.teamId)) {
        throw new AnalyticsAccessDeniedError(userId, 'agent');
      }
    }

    // Build date filter
    const dateFilter = {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
      assignedTo: agentId,
    };

    // Get ticket counts
    const assignedTickets = await prisma.ticket.count({
      where: dateFilter,
    });

    const resolvedTickets = await prisma.ticket.count({
      where: {
        ...dateFilter,
        status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      },
    });

    const openTickets = await prisma.ticket.count({
      where: {
        assignedTo: agentId,
        status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_CUSTOMER] },
      },
    });

    // Calculate average resolution time
    const resolvedTicketsData = await prisma.ticket.findMany({
      where: {
        ...dateFilter,
        status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    const averageResolutionTime = this.calculateAverageHours(
      resolvedTicketsData.map(t => ({ start: t.createdAt, end: t.resolvedAt }))
    );

    // Calculate average response time (time from assignment to first action)
    const assignedTicketsData = await prisma.ticket.findMany({
      where: dateFilter,
      select: {
        history: {
          where: {
            action: 'assigned',
            newValue: agentId,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
        },
        comments: {
          where: {
            authorId: agentId,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
        },
      },
    });

    const responseTimeData = assignedTicketsData
      .filter(t => t.history.length > 0 && t.comments.length > 0)
      .map(t => ({
        start: t.history[0].createdAt,
        end: t.comments[0].createdAt,
      }));

    const averageResponseTime = this.calculateAverageHours(responseTimeData);

    // Calculate customer satisfaction score
    const feedbackData = await prisma.ticketFeedback.findMany({
      where: {
        ticket: {
          ...dateFilter,
        },
      },
      select: {
        rating: true,
      },
    });

    const customerSatisfactionScore = feedbackData.length > 0
      ? Math.round((feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length) * 100) / 100
      : 0;

    // Calculate SLA compliance rate
    const ticketsWithSLA = await prisma.ticket.findMany({
      where: {
        ...dateFilter,
        slaDueAt: { not: null },
        status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      },
      select: {
        slaDueAt: true,
        resolvedAt: true,
      },
    });

    const slaCompliantCount = ticketsWithSLA.filter(
      t => t.resolvedAt && t.slaDueAt && t.resolvedAt <= t.slaDueAt
    ).length;

    const slaComplianceRate = ticketsWithSLA.length > 0
      ? Math.round((slaCompliantCount / ticketsWithSLA.length) * 10000) / 100
      : 0;

    return {
      agentId: agent.id,
      agentName: agent.name || 'Unknown',
      assignedTickets,
      resolvedTickets,
      openTickets,
      averageResolutionTime,
      averageResponseTime,
      customerSatisfactionScore,
      slaComplianceRate,
    };
  }

  /**
   * Get comparative analysis across teams (Admin only)
   */
  async getComparativeAnalysis(userId: string, dateRange: DateRange): Promise<ComparativeAnalysis> {
    // Check permission - Admin only
    const canAccess = await this.canAccessOrganizationAnalytics(userId);
    if (!canAccess) {
      throw new AnalyticsAccessDeniedError(userId, 'comparative');
    }

    // Get all teams
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Collect metrics for each team
    const teamMetricsData: Array<{
      teamId: string;
      teamName: string;
      resolutionTime: number;
      slaCompliance: number;
      customerSatisfaction: number;
      ticketVolume: number;
    }> = [];

    for (const team of teams) {
      const dateFilter = {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
        teamId: team.id,
      };

      // Get ticket volume
      const ticketVolume = await prisma.ticket.count({
        where: dateFilter,
      });

      // Calculate resolution time
      const resolvedData = await prisma.ticket.findMany({
        where: {
          ...dateFilter,
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      });

      const resolutionTime = this.calculateAverageHours(
        resolvedData.map(t => ({ start: t.createdAt, end: t.resolvedAt }))
      );

      // Calculate SLA compliance
      const ticketsWithSLA = await prisma.ticket.findMany({
        where: {
          ...dateFilter,
          slaDueAt: { not: null },
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
        select: {
          slaDueAt: true,
          resolvedAt: true,
        },
      });

      const slaCompliantCount = ticketsWithSLA.filter(
        t => t.resolvedAt && t.slaDueAt && t.resolvedAt <= t.slaDueAt
      ).length;

      const slaCompliance = ticketsWithSLA.length > 0
        ? Math.round((slaCompliantCount / ticketsWithSLA.length) * 10000) / 100
        : 0;

      // Calculate customer satisfaction
      const feedbackData = await prisma.ticketFeedback.findMany({
        where: {
          ticket: dateFilter,
        },
        select: {
          rating: true,
        },
      });

      const customerSatisfaction = feedbackData.length > 0
        ? Math.round((feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length) * 100) / 100
        : 0;

      teamMetricsData.push({
        teamId: team.id,
        teamName: team.name,
        resolutionTime,
        slaCompliance,
        customerSatisfaction,
        ticketVolume,
      });
    }

    // Calculate team rankings based on composite score
    const teamRankings: TeamRanking[] = teamMetricsData
      .map(team => {
        // Normalize metrics (higher is better)
        // For resolution time, lower is better, so invert it
        const normalizedResolutionTime = team.resolutionTime > 0 ? 100 / team.resolutionTime : 0;
        const normalizedSLA = team.slaCompliance;
        const normalizedSatisfaction = team.customerSatisfaction * 20; // Scale 1-5 to 0-100

        // Composite score (weighted average)
        const score = Math.round(
          (normalizedResolutionTime * 0.3 + normalizedSLA * 0.4 + normalizedSatisfaction * 0.3) * 100
        ) / 100;

        return {
          teamId: team.teamId,
          teamName: team.teamName,
          score,
          metrics: {
            resolutionTime: team.resolutionTime,
            slaCompliance: team.slaCompliance,
            customerSatisfaction: team.customerSatisfaction,
            ticketVolume: team.ticketVolume,
          },
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((team, index) => ({
        rank: index + 1,
        ...team,
      }));

    // Calculate performance trends (compare with previous period)
    const previousPeriodStart = new Date(dateRange.startDate);
    const previousPeriodEnd = new Date(dateRange.endDate);
    const periodDuration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);
    previousPeriodEnd.setTime(previousPeriodEnd.getTime() - periodDuration);

    const performanceTrends: PerformanceTrend[] = [];

    for (const team of teamMetricsData) {
      // Get previous period resolution time
      const prevResolvedData = await prisma.ticket.findMany({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd,
          },
          teamId: team.teamId,
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      });

      const prevResolutionTime = this.calculateAverageHours(
        prevResolvedData.map(t => ({ start: t.createdAt, end: t.resolvedAt }))
      );

      if (prevResolutionTime > 0) {
        const changePercentage = Math.round(
          ((team.resolutionTime - prevResolutionTime) / prevResolutionTime) * 10000
        ) / 100;

        let trend: 'improving' | 'declining' | 'stable';
        if (changePercentage < -5) {
          trend = 'improving'; // Resolution time decreased (better)
        } else if (changePercentage > 5) {
          trend = 'declining'; // Resolution time increased (worse)
        } else {
          trend = 'stable';
        }

        performanceTrends.push({
          teamId: team.teamId,
          teamName: team.teamName,
          trend,
          changePercentage: Math.abs(changePercentage),
          metric: 'resolutionTime',
        });
      }
    }

    // Identify outliers (teams significantly above or below average)
    const outliers: PerformanceOutlier[] = [];

    if (teamMetricsData.length > 0) {
      // Calculate averages
      const avgResolutionTime = teamMetricsData.reduce((sum, t) => sum + t.resolutionTime, 0) / teamMetricsData.length;
      const avgSLACompliance = teamMetricsData.reduce((sum, t) => sum + t.slaCompliance, 0) / teamMetricsData.length;
      const avgCustomerSat = teamMetricsData.reduce((sum, t) => sum + t.customerSatisfaction, 0) / teamMetricsData.length;

      // Calculate standard deviations
      const stdDevResolution = Math.sqrt(
        teamMetricsData.reduce((sum, t) => sum + Math.pow(t.resolutionTime - avgResolutionTime, 2), 0) / teamMetricsData.length
      );
      const stdDevSLA = Math.sqrt(
        teamMetricsData.reduce((sum, t) => sum + Math.pow(t.slaCompliance - avgSLACompliance, 2), 0) / teamMetricsData.length
      );

      // Identify outliers (more than 1.5 standard deviations from mean)
      for (const team of teamMetricsData) {
        // Check resolution time outliers
        if (stdDevResolution > 0) {
          const resolutionDeviation = (team.resolutionTime - avgResolutionTime) / stdDevResolution;
          if (Math.abs(resolutionDeviation) > 1.5) {
            outliers.push({
              type: resolutionDeviation < 0 ? 'high_performer' : 'needs_attention',
              entityType: 'team',
              entityId: team.teamId,
              entityName: team.teamName,
              metric: 'resolutionTime',
              value: team.resolutionTime,
              deviation: Math.round(Math.abs(resolutionDeviation) * 100) / 100,
            });
          }
        }

        // Check SLA compliance outliers
        if (stdDevSLA > 0) {
          const slaDeviation = (team.slaCompliance - avgSLACompliance) / stdDevSLA;
          if (Math.abs(slaDeviation) > 1.5) {
            outliers.push({
              type: slaDeviation > 0 ? 'high_performer' : 'needs_attention',
              entityType: 'team',
              entityId: team.teamId,
              entityName: team.teamName,
              metric: 'slaCompliance',
              value: team.slaCompliance,
              deviation: Math.round(Math.abs(slaDeviation) * 100) / 100,
            });
          }
        }
      }
    }

    // Generate executive summary
    const totalTickets = teamMetricsData.reduce((sum, t) => sum + t.ticketVolume, 0);
    const overallResolutionTime = teamMetricsData.length > 0
      ? Math.round((teamMetricsData.reduce((sum, t) => sum + t.resolutionTime, 0) / teamMetricsData.length) * 100) / 100
      : 0;
    const overallSLACompliance = teamMetricsData.length > 0
      ? Math.round((teamMetricsData.reduce((sum, t) => sum + t.slaCompliance, 0) / teamMetricsData.length) * 100) / 100
      : 0;
    const overallCustomerSatisfaction = teamMetricsData.length > 0
      ? Math.round((teamMetricsData.reduce((sum, t) => sum + t.customerSatisfaction, 0) / teamMetricsData.length) * 100) / 100
      : 0;

    const topPerformingTeam = teamRankings.length > 0 ? teamRankings[0].teamName : 'N/A';

    const areasForImprovement: string[] = [];
    if (overallSLACompliance < 80) {
      areasForImprovement.push('SLA compliance below target (80%)');
    }
    if (overallCustomerSatisfaction < 4.0) {
      areasForImprovement.push('Customer satisfaction below target (4.0)');
    }
    if (outliers.filter(o => o.type === 'needs_attention').length > 0) {
      areasForImprovement.push(`${outliers.filter(o => o.type === 'needs_attention').length} team(s) need attention`);
    }

    const executiveSummary: ExecutiveSummary = {
      totalTickets,
      overallResolutionTime,
      overallSLACompliance,
      overallCustomerSatisfaction,
      topPerformingTeam,
      areasForImprovement,
    };

    return {
      teamRankings,
      performanceTrends,
      outliers,
      executiveSummary,
    };
  }

  /**
   * Export report with role-based access
   */
  async exportReport(
    reportType: 'organization' | 'team' | 'agent' | 'comparative',
    format: 'csv' | 'json',
    filters: {
      teamId?: string;
      agentId?: string;
      dateRange: DateRange;
    },
    userId: string
  ): Promise<string> {
    // Check export permission
    const user = await this.getUserWithRole(userId);
    if (!user?.role) {
      throw new AnalyticsAccessDeniedError(userId, 'export');
    }

    const roleName = user.role.name as RoleType;
    const permissions = TICKET_PERMISSIONS[roleName];

    if (!permissions.analytics.export) {
      throw new AnalyticsAccessDeniedError(userId, 'export');
    }

    // Get data based on report type
    let data: any;

    switch (reportType) {
      case 'organization':
        if (permissions.analytics.view !== 'organization') {
          throw new AnalyticsAccessDeniedError(userId, 'organization report');
        }
        data = await this.getOrganizationMetrics(userId, filters.dateRange);
        break;

      case 'team':
        if (!filters.teamId) {
          throw new Error('Team ID is required for team report');
        }
        data = await this.getTeamMetrics(filters.teamId, userId, filters.dateRange);
        break;

      case 'agent':
        if (!filters.agentId) {
          throw new Error('Agent ID is required for agent report');
        }
        data = await this.getAgentMetrics(filters.agentId, userId, filters.dateRange);
        break;

      case 'comparative':
        if (permissions.analytics.view !== 'organization') {
          throw new AnalyticsAccessDeniedError(userId, 'comparative report');
        }
        data = await this.getComparativeAnalysis(userId, filters.dateRange);
        break;

      default:
        throw new Error(`Invalid report type: ${reportType}`);
    }

    // Format data based on requested format
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(data, reportType);
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any, reportType: string): string {
    const lines: string[] = [];

    switch (reportType) {
      case 'organization':
        lines.push('Metric,Value');
        lines.push(`Total Tickets,${data.totalTickets}`);
        lines.push(`Open Tickets,${data.openTickets}`);
        lines.push(`Resolved Tickets,${data.resolvedTickets}`);
        lines.push(`Closed Tickets,${data.closedTickets}`);
        lines.push(`Average Resolution Time (hours),${data.averageResolutionTime}`);
        lines.push(`Average Response Time (hours),${data.averageResponseTime}`);
        lines.push(`Customer Satisfaction Score,${data.customerSatisfactionScore}`);
        lines.push(`SLA Compliance Rate (%),${data.slaComplianceRate}`);
        lines.push('');
        lines.push('Team Performance');
        lines.push('Team Name,Total Tickets,Resolved Tickets,Avg Resolution Time,SLA Compliance Rate');
        data.teamPerformance.forEach((team: TeamPerformanceSummary) => {
          lines.push(`${team.teamName},${team.totalTickets},${team.resolvedTickets},${team.averageResolutionTime},${team.slaComplianceRate}`);
        });
        break;

      case 'team':
        lines.push('Metric,Value');
        lines.push(`Team Name,${data.teamName}`);
        lines.push(`Total Tickets,${data.totalTickets}`);
        lines.push(`Open Tickets,${data.openTickets}`);
        lines.push(`Resolved Tickets,${data.resolvedTickets}`);
        lines.push(`Closed Tickets,${data.closedTickets}`);
        lines.push(`Average Resolution Time (hours),${data.averageResolutionTime}`);
        lines.push(`Average Response Time (hours),${data.averageResponseTime}`);
        lines.push(`Customer Satisfaction Score,${data.customerSatisfactionScore}`);
        lines.push(`SLA Compliance Rate (%),${data.slaComplianceRate}`);
        lines.push('');
        lines.push('Agent Performance');
        lines.push('Agent Name,Assigned Tickets,Resolved Tickets,Avg Resolution Time');
        data.agentPerformance.forEach((agent: AgentPerformanceSummary) => {
          lines.push(`${agent.agentName},${agent.assignedTickets},${agent.resolvedTickets},${agent.averageResolutionTime}`);
        });
        lines.push('');
        lines.push('Workload Distribution');
        lines.push('Agent Name,Open Tickets,In Progress Tickets,Total Assigned');
        data.workloadDistribution.forEach((workload: WorkloadData) => {
          lines.push(`${workload.agentName},${workload.openTickets},${workload.inProgressTickets},${workload.totalAssigned}`);
        });
        break;

      case 'agent':
        lines.push('Metric,Value');
        lines.push(`Agent Name,${data.agentName}`);
        lines.push(`Assigned Tickets,${data.assignedTickets}`);
        lines.push(`Resolved Tickets,${data.resolvedTickets}`);
        lines.push(`Open Tickets,${data.openTickets}`);
        lines.push(`Average Resolution Time (hours),${data.averageResolutionTime}`);
        lines.push(`Average Response Time (hours),${data.averageResponseTime}`);
        lines.push(`Customer Satisfaction Score,${data.customerSatisfactionScore}`);
        lines.push(`SLA Compliance Rate (%),${data.slaComplianceRate}`);
        break;

      case 'comparative':
        lines.push('Team Rankings');
        lines.push('Rank,Team Name,Score,Resolution Time,SLA Compliance,Customer Satisfaction,Ticket Volume');
        data.teamRankings.forEach((team: TeamRanking) => {
          lines.push(`${team.rank},${team.teamName},${team.score},${team.metrics.resolutionTime},${team.metrics.slaCompliance},${team.metrics.customerSatisfaction},${team.metrics.ticketVolume}`);
        });
        lines.push('');
        lines.push('Performance Trends');
        lines.push('Team Name,Trend,Change %,Metric');
        data.performanceTrends.forEach((trend: PerformanceTrend) => {
          lines.push(`${trend.teamName},${trend.trend},${trend.changePercentage},${trend.metric}`);
        });
        lines.push('');
        lines.push('Outliers');
        lines.push('Type,Entity Type,Entity Name,Metric,Value,Deviation');
        data.outliers.forEach((outlier: PerformanceOutlier) => {
          lines.push(`${outlier.type},${outlier.entityType},${outlier.entityName},${outlier.metric},${outlier.value},${outlier.deviation}`);
        });
        break;
    }

    return lines.join('\n');
  }

  /**
   * Get role-specific dashboard data
   */
  async getDashboardData(userId: string, dateRange: DateRange): Promise<any> {
    const user = await this.getUserWithRole(userId);
    if (!user?.role) {
      throw new Error('User role not found');
    }

    const roleName = user.role.name as RoleType;
    const permissions = TICKET_PERMISSIONS[roleName];

    switch (permissions.analytics.view) {
      case 'organization':
        // Admin gets organization-wide dashboard
        return await this.getOrganizationMetrics(userId, dateRange);

      case 'team':
        // Team Leader gets their teams' dashboard
        const userTeamIds = await this.getUserTeamIds(userId);
        if (userTeamIds.length === 0) {
          return null;
        }
        // Return metrics for the first team (or aggregate if multiple)
        return await this.getTeamMetrics(userTeamIds[0], userId, dateRange);

      case 'none':
      default:
        // User/Employee has no analytics access
        return null;
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
