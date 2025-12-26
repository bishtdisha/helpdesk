import { prisma } from '../db';
import { RoleType, UserWithRole } from '../types/rbac';
import { TICKET_PERMISSIONS, ROLE_TYPES, AnalyticsAccessScope } from './permissions';

export interface AnalyticsScope {
  level: AnalyticsAccessScope;
  teamIds: string[];
  canExport: boolean;
  canViewComparative: boolean;
}

export type ReportType = 'organization' | 'team' | 'agent' | 'customer' | 'sla' | 'quality';

/**
 * Analytics Access Control Service
 * Handles role-based access control for analytics and reporting
 */
export class AnalyticsAccessControl {
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
   * Get analytics scope for a user based on their role
   */
  async getAnalyticsScope(userId: string): Promise<AnalyticsScope> {
    const user = await this.getUserWithRole(userId);

    if (!user?.role) {
      throw new Error('User role not found');
    }

    const roleName = user.role.name as RoleType;
    const permissions = TICKET_PERMISSIONS[roleName];

    switch (roleName) {
      case ROLE_TYPES.ADMIN_MANAGER:
        return {
          level: 'organization',
          teamIds: [],
          canExport: permissions.analytics.export,
          canViewComparative: permissions.analytics.viewComparative,
        };

      case ROLE_TYPES.TEAM_LEADER:
        const teamIds = await this.getUserTeamIds(userId);
        return {
          level: 'team',
          teamIds,
          canExport: permissions.analytics.export,
          canViewComparative: permissions.analytics.viewComparative,
        };

      case ROLE_TYPES.USER_EMPLOYEE:
        return {
          level: 'none',
          teamIds: [],
          canExport: permissions.analytics.export,
          canViewComparative: permissions.analytics.viewComparative,
        };

      default:
        return {
          level: 'none',
          teamIds: [],
          canExport: false,
          canViewComparative: false,
        };
    }
  }

  /**
   * Check if user can view analytics
   */
  async canViewAnalytics(userId: string): Promise<boolean> {
    const scope = await this.getAnalyticsScope(userId);
    return scope.level !== 'none';
  }

  /**
   * Check if user can view organization-wide analytics
   */
  async canViewOrganizationAnalytics(userId: string): Promise<boolean> {
    const scope = await this.getAnalyticsScope(userId);
    return scope.level === 'organization';
  }

  /**
   * Check if user can view team analytics
   */
  async canViewTeamAnalytics(userId: string, teamId: string): Promise<boolean> {
    const scope = await this.getAnalyticsScope(userId);
    
    if (scope.level === 'organization') {
      return true; // Admin can view all teams
    }
    
    if (scope.level === 'team') {
      return scope.teamIds.includes(teamId);
    }
    
    return false;
  }

  /**
   * Check if user can view agent analytics
   */
  async canViewAgentAnalytics(userId: string, agentId: string): Promise<boolean> {
    const scope = await this.getAnalyticsScope(userId);
    
    if (scope.level === 'organization') {
      return true; // Admin can view all agents
    }
    
    if (scope.level === 'team') {
      // Team Leader can view agents in their teams
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: { teamId: true },
      });
      
      if (!agent?.teamId) return false;
      return scope.teamIds.includes(agent.teamId);
    }
    
    return false;
  }

  /**
   * Check if user can export reports
   */
  async canExportReports(userId: string): Promise<boolean> {
    const scope = await this.getAnalyticsScope(userId);
    return scope.canExport;
  }

  /**
   * Check if user can view comparative analysis
   */
  async canViewComparativeAnalysis(userId: string): Promise<boolean> {
    const scope = await this.getAnalyticsScope(userId);
    return scope.canViewComparative;
  }

  /**
   * Check if user can access a specific report type
   */
  async canAccessReportType(userId: string, reportType: ReportType): Promise<boolean> {
    const scope = await this.getAnalyticsScope(userId);

    switch (reportType) {
      case 'organization':
        return scope.level === 'organization';

      case 'team':
        return scope.level === 'organization' || scope.level === 'team';

      case 'agent':
        return scope.level === 'organization' || scope.level === 'team';

      case 'customer':
        return scope.level === 'organization' || scope.level === 'team';

      case 'sla':
        return scope.level === 'organization' || scope.level === 'team';

      case 'quality':
        return scope.level === 'organization' || scope.level === 'team';

      default:
        return false;
    }
  }

  /**
   * Filter analytics data based on user's scope
   * Generic method to filter any data that has a teamId property
   */
  async filterAnalyticsData<T extends { teamId?: string | null }>(
    userId: string,
    data: T[]
  ): Promise<T[]> {
    const scope = await this.getAnalyticsScope(userId);

    if (scope.level === 'organization') {
      return data; // No filtering for admin
    }

    if (scope.level === 'team') {
      return data.filter(item => {
        const teamId = item.teamId;
        return teamId && scope.teamIds.includes(teamId);
      });
    }

    return []; // No access
  }

  /**
   * Get team filter for analytics queries
   * Returns Prisma where clause for filtering by team
   */
  async getTeamFilter(userId: string): Promise<{ teamId?: { in: string[] } } | Record<string, never>> {
    const scope = await this.getAnalyticsScope(userId);

    if (scope.level === 'organization') {
      return {}; // No filter
    }

    if (scope.level === 'team') {
      if (scope.teamIds.length === 0) {
        return { teamId: 'impossible' }; // No teams, no data
      }
      return { teamId: { in: scope.teamIds } };
    }

    return { teamId: 'impossible' }; // No access
  }

  /**
   * Validate export request
   */
  async validateExportRequest(
    userId: string,
    reportType: ReportType,
    teamId?: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const canExport = await this.canExportReports(userId);
    if (!canExport) {
      return { valid: false, reason: 'User does not have export permissions' };
    }

    const canAccessReport = await this.canAccessReportType(userId, reportType);
    if (!canAccessReport) {
      return { valid: false, reason: `User cannot access ${reportType} reports` };
    }

    // If teamId is specified, verify access to that team
    if (teamId) {
      const canAccessTeam = await this.canViewTeamAnalytics(userId, teamId);
      if (!canAccessTeam) {
        return { valid: false, reason: 'User cannot access analytics for the specified team' };
      }
    }

    return { valid: true };
  }

  /**
   * Get accessible team IDs for analytics
   * Returns list of team IDs the user can view analytics for
   */
  async getAccessibleTeamIds(userId: string): Promise<string[]> {
    const scope = await this.getAnalyticsScope(userId);

    if (scope.level === 'organization') {
      // Admin can access all teams
      const teams = await prisma.team.findMany({
        select: { id: true },
      });
      return teams.map(t => t.id);
    }

    if (scope.level === 'team') {
      return scope.teamIds;
    }

    return [];
  }

  /**
   * Check if user can view customer analytics
   */
  async canViewCustomerAnalytics(userId: string, customerId: string): Promise<boolean> {
    const scope = await this.getAnalyticsScope(userId);

    if (scope.level === 'organization') {
      return true; // Admin can view all customer analytics
    }

    if (scope.level === 'team') {
      // Team Leader can view customer analytics if customer has tickets in their teams
      const customerTickets = await prisma.ticket.findMany({
        where: { 
          customerId,
          teamId: { in: scope.teamIds },
        },
        select: { id: true },
        take: 1,
      });

      return customerTickets.length > 0;
    }

    return false;
  }
}

// Export singleton instance
export const analyticsAccessControl = new AnalyticsAccessControl();
