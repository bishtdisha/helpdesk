import { prisma } from '../db';
import { RoleType, UserWithRole } from '../types/rbac';
import { TICKET_PERMISSIONS, ROLE_TYPES, KnowledgeBaseAccessScope } from './permissions';
import { KnowledgeBaseArticle, KnowledgeAccessLevel } from '@prisma/client';

export interface KBQueryFilter {
  OR?: Array<{
    accessLevel?: KnowledgeAccessLevel;
    teamId?: { in: string[] } | string;
  }>;
  accessLevel?: KnowledgeAccessLevel | { in: KnowledgeAccessLevel[] };
  teamId?: { in: string[] } | string;
  isPublished?: boolean;
}

/**
 * Knowledge Base Access Control Service
 * Handles role-based access control for knowledge base articles
 */
export class KnowledgeBaseAccessControl {
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
   * Get article by ID
   */
  private async getArticle(articleId: string): Promise<KnowledgeBaseArticle | null> {
    return await prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
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
   * Check if user is in a specific team
   */
  private async isUserInTeam(userId: string, teamId: string): Promise<boolean> {
    const teamIds = await this.getUserTeamIds(userId);
    return teamIds.includes(teamId);
  }

  /**
   * Get article filters based on user role and team
   * Returns Prisma where clause for filtering articles
   */
  async getArticleFilters(userId: string): Promise<KBQueryFilter> {
    const user = await this.getUserWithRole(userId);

    if (!user?.role) {
      // Unauthenticated users can only see public published articles
      return { 
        accessLevel: 'PUBLIC',
        isPublished: true,
      };
    }

    const roleName = user.role.name as RoleType;

    switch (roleName) {
      case ROLE_TYPES.ADMIN_MANAGER:
        // Admin can see all articles (including unpublished)
        return {};

      case ROLE_TYPES.TEAM_LEADER:
        const teamIds = await this.getUserTeamIds(userId);
        return {
          OR: [
            { accessLevel: 'PUBLIC' },
            { accessLevel: 'INTERNAL' },
            { 
              accessLevel: 'RESTRICTED',
              teamId: { in: teamIds },
            },
          ],
          isPublished: true,
        };

      case ROLE_TYPES.USER_EMPLOYEE:
        return {
          OR: [
            { accessLevel: 'PUBLIC' },
            { accessLevel: 'INTERNAL' },
          ],
          isPublished: true,
        };

      default:
        return { 
          accessLevel: 'PUBLIC',
          isPublished: true,
        };
    }
  }

  /**
   * Check if user can access a specific article
   */
  async canAccessArticle(userId: string, articleId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    const article = await this.getArticle(articleId);

    if (!article) return false;

    // Unpublished articles are only visible to admins
    if (!article.isPublished) {
      if (!user?.role) return false;
      return user.role.name === ROLE_TYPES.ADMIN_MANAGER;
    }

    // Public articles are accessible to everyone
    if (article.accessLevel === 'PUBLIC') {
      return true;
    }

    // Internal and restricted articles require authentication
    if (!user?.role) return false;

    const roleName = user.role.name as RoleType;

    switch (article.accessLevel) {
      case 'INTERNAL':
        // All authenticated users can access internal articles
        return true;

      case 'RESTRICTED':
        // Only specific teams can access restricted articles
        if (roleName === ROLE_TYPES.ADMIN_MANAGER) {
          return true;
        }
        if (!article.teamId) {
          // Restricted article without team assignment - only admin can access
          return false;
        }
        return await this.isUserInTeam(userId, article.teamId);

      default:
        return false;
    }
  }

  /**
   * Check if user can modify (update) an article
   */
  async canModifyArticle(userId: string, articleId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    const article = await this.getArticle(articleId);

    if (!user?.role || !article) return false;

    const roleName = user.role.name as RoleType;
    const permissions = TICKET_PERMISSIONS[roleName];

    if (permissions.knowledgeBase.update === 'all') {
      return true;
    }

    if (permissions.knowledgeBase.update === 'own') {
      return article.authorId === userId;
    }

    if (permissions.knowledgeBase.update === 'team') {
      if (!article.teamId) return false;
      return await this.isUserInTeam(userId, article.teamId);
    }

    return false;
  }

  /**
   * Check if user can create articles
   */
  async canCreateArticle(userId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);

    if (!user?.role) return false;

    const roleName = user.role.name as RoleType;
    const permissions = TICKET_PERMISSIONS[roleName];

    return permissions.knowledgeBase.create === true;
  }

  /**
   * Check if user can delete an article
   */
  async canDeleteArticle(userId: string, articleId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    const article = await this.getArticle(articleId);

    if (!user?.role || !article) return false;

    const roleName = user.role.name as RoleType;
    const permissions = TICKET_PERMISSIONS[roleName];

    return permissions.knowledgeBase.delete === true;
  }

  /**
   * Check if user can publish/unpublish articles
   */
  async canPublishArticle(userId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);

    if (!user?.role) return false;

    const roleName = user.role.name as RoleType;
    const permissions = TICKET_PERMISSIONS[roleName];

    return permissions.knowledgeBase.publish === true;
  }

  /**
   * Validate article access level assignment
   * Ensures users can only create articles with appropriate access levels
   */
  async validateAccessLevelAssignment(
    userId: string,
    accessLevel: KnowledgeAccessLevel,
    teamId?: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const user = await this.getUserWithRole(userId);

    if (!user?.role) {
      return { valid: false, reason: 'User role not found' };
    }

    const roleName = user.role.name as RoleType;

    switch (roleName) {
      case ROLE_TYPES.ADMIN_MANAGER:
        // Admin can set any access level
        return { valid: true };

      case ROLE_TYPES.TEAM_LEADER:
        // Team Leader can create PUBLIC, INTERNAL, or RESTRICTED (for their teams)
        if (accessLevel === 'RESTRICTED') {
          if (!teamId) {
            return { 
              valid: false, 
              reason: 'Team ID required for restricted articles',
            };
          }
          const canAccessTeam = await this.isUserInTeam(userId, teamId);
          if (!canAccessTeam) {
            return { 
              valid: false, 
              reason: 'Cannot create restricted articles for teams you do not lead',
            };
          }
        }
        return { valid: true };

      default:
        return { 
          valid: false, 
          reason: 'Insufficient permissions to create articles',
        };
    }
  }
}

// Export singleton instance
export const knowledgeBaseAccessControl = new KnowledgeBaseAccessControl();
