import { prisma } from '../db';
import {
  RBACPermission,
  AccessScope,
  AccessResult,
  UserPermissions,
  UserWithRole,
  RoleType,
  PermissionScope,
} from '../types/rbac';
import {
  ROLE_PERMISSIONS,
  ROLE_ACCESS_SCOPES,
  hasPermission,
  canAccessUser,
  canAccessTeam,
  ROLE_TYPES,
} from './permissions';
import {
  InsufficientPermissionsError,
  InvalidScopeError,
  TeamAccessDeniedError,
  UserNotFoundError,
  UnauthorizedActionError,
} from './errors';
import { rbacCache } from './cache';

/**
 * Permission Engine - Core service for RBAC permission checking and validation
 * 
 * This service provides centralized permission checking logic for the RBAC system.
 * It handles action-based authorization, scope-based access control, and user permission retrieval.
 */
export class PermissionEngine {
  /**
   * Check if a user has permission to perform a specific action on a resource
   * 
   * @param userId - The ID of the user requesting permission
   * @param action - The action to be performed (create, read, update, delete, etc.)
   * @param resource - The resource type (users, teams, tickets, etc.)
   * @param targetUserId - Optional target user ID for user-specific operations
   * @param teamId - Optional team ID for team-specific operations
   * @returns Promise<boolean> - True if permission is granted, false otherwise
   */
  async checkPermission(
    userId: string,
    action: string,
    resource: string,
    targetUserId?: string,
    teamId?: string
  ): Promise<boolean> {
    try {
      // Get user with role information
      const user = await this.getUserWithRole(userId);
      if (!user || !user.role) {
        return false;
      }

      // Get user's permissions based on their role
      const userPermissions = this.getRolePermissions(user.role.name as RoleType);
      
      // Check if user has the required permission
      const hasRequiredPermission = hasPermission(userPermissions, action, resource);
      if (!hasRequiredPermission) {
        return false;
      }

      // Get the specific permission to check scope
      const permission = userPermissions.find(p => p.action === action && p.resource === resource);
      if (!permission) {
        return false;
      }

      // Validate scope-based access
      return await this.validateScopeAccess(user, permission.scope, targetUserId, teamId);
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Get all effective permissions for a user
   * 
   * @param userId - The ID of the user
   * @returns Promise<UserPermissions> - User's complete permission set
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    // Try to get from cache first
    const cachedPermissions = await rbacCache.getCachedUserPermissions(userId);
    if (cachedPermissions) {
      return cachedPermissions;
    }

    const user = await this.getUserWithRole(userId);
    if (!user || !user.role) {
      throw new UserNotFoundError(userId);
    }

    const roleType = user.role.name as RoleType;
    const permissions = this.getRolePermissions(roleType);
    const accessScope = await this.getUserAccessScope(user);

    const userPermissions: UserPermissions = {
      userId: user.id,
      roleId: user.role.id,
      roleName: user.role.name,
      permissions,
      accessScope,
      teamIds: await this.getUserTeamIds(user),
    };

    // Cache the result
    await rbacCache.cacheUserPermissions(userId, userPermissions);

    return userPermissions;
  }

  /**
   * Validate access based on user role and scope requirements
   * 
   * @param userId - The ID of the user requesting access
   * @param targetUserId - Optional target user ID for user-specific operations
   * @param teamId - Optional team ID for team-specific operations
   * @returns Promise<AccessResult> - Detailed access validation result
   */
  async validateAccess(
    userId: string,
    targetUserId?: string,
    teamId?: string
  ): Promise<AccessResult> {
    try {
      const user = await this.getUserWithRole(userId);
      if (!user || !user.role) {
        return {
          allowed: false,
          reason: 'User not found or has no role assigned',
          scope: this.getDefaultAccessScope(),
        };
      }

      const roleType = user.role.name as RoleType;
      const accessScope = await this.getUserAccessScope(user);

      // Validate user access if targetUserId is provided
      if (targetUserId) {
        const userTeamIds = await this.getUserTeamIds(user);
        const targetUser = await this.getUserWithRole(targetUserId);
        
        const canAccess = canAccessUser(
          roleType,
          userTeamIds,
          targetUser?.teamId || undefined,
          targetUserId,
          userId
        );

        if (!canAccess) {
          return {
            allowed: false,
            reason: `Insufficient permissions to access user ${targetUserId}`,
            scope: accessScope,
          };
        }
      }

      // Validate team access if teamId is provided
      if (teamId) {
        const userTeamIds = await this.getUserTeamIds(user);
        const canAccess = canAccessTeam(roleType, userTeamIds, teamId);

        if (!canAccess) {
          return {
            allowed: false,
            reason: `Insufficient permissions to access team ${teamId}`,
            scope: accessScope,
          };
        }
      }

      return {
        allowed: true,
        scope: accessScope,
      };
    } catch (error) {
      console.error('Access validation failed:', error);
      return {
        allowed: false,
        reason: 'Access validation failed due to internal error',
        scope: this.getDefaultAccessScope(),
      };
    }
  }

  /**
   * Check if user has permission and throw error if not
   * 
   * @param userId - The ID of the user requesting permission
   * @param action - The action to be performed
   * @param resource - The resource type
   * @param targetUserId - Optional target user ID
   * @param teamId - Optional team ID
   * @throws InsufficientPermissionsError if permission is denied
   */
  async requirePermission(
    userId: string,
    action: string,
    resource: string,
    targetUserId?: string,
    teamId?: string
  ): Promise<void> {
    const hasPermission = await this.checkPermission(userId, action, resource, targetUserId, teamId);
    if (!hasPermission) {
      throw new InsufficientPermissionsError(action, resource, `${resource}:${action}`);
    }
  }

  /**
   * Check if user can access another user's data
   * 
   * @param userId - The ID of the user requesting access
   * @param targetUserId - The ID of the target user
   * @returns Promise<boolean> - True if access is allowed
   */
  async canAccessUserData(userId: string, targetUserId: string): Promise<boolean> {
    const accessResult = await this.validateAccess(userId, targetUserId);
    return accessResult.allowed;
  }

  /**
   * Check if user can access team data
   * 
   * @param userId - The ID of the user requesting access
   * @param teamId - The ID of the team
   * @returns Promise<boolean> - True if access is allowed
   */
  async canAccessTeamData(userId: string, teamId: string): Promise<boolean> {
    const accessResult = await this.validateAccess(userId, undefined, teamId);
    return accessResult.allowed;
  }

  // Private helper methods

  /**
   * Get user with role information from database
   */
  private async getUserWithRole(userId: string): Promise<UserWithRole | null> {
    // Try to get from cache first
    const cachedUser = await rbacCache.getCachedUserWithRole(userId);
    if (cachedUser) {
      return cachedUser;
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

    // Cache the result if user exists
    if (user) {
      await rbacCache.cacheUserWithRole(userId, user);
    }

    return user;
  }

  /**
   * Get permissions for a specific role type
   */
  private getRolePermissions(roleType: RoleType): RBACPermission[] {
    return ROLE_PERMISSIONS[roleType] || [];
  }

  /**
   * Get access scope for a user based on their role and team assignments
   */
  private async getUserAccessScope(user: UserWithRole): Promise<AccessScope> {
    // Try to get from cache first
    const cachedScope = await rbacCache.getCachedAccessScope(user.id);
    if (cachedScope) {
      return cachedScope;
    }

    const roleType = user.role?.name as RoleType;
    const baseScope = { ...ROLE_ACCESS_SCOPES[roleType] };

    // Populate team IDs based on role
    if (roleType === ROLE_TYPES.ADMIN_MANAGER) {
      // Admin can access all teams - leave empty array to indicate "all"
      baseScope.teamIds = [];
    } else if (roleType === ROLE_TYPES.TEAM_LEADER) {
      // Team leaders can access teams they lead
      const teamIds = user.teamLeaderships.map(tl => tl.teamId);
      if (user.teamId) {
        teamIds.push(user.teamId);
      }
      baseScope.teamIds = Array.from(new Set(teamIds)); // Remove duplicates
    } else if (roleType === ROLE_TYPES.USER_EMPLOYEE) {
      // Regular users can only access their own team
      baseScope.teamIds = user.teamId ? [user.teamId] : [];
    }

    // Cache the result
    await rbacCache.cacheAccessScope(user.id, baseScope);

    return baseScope;
  }

  /**
   * Get all team IDs a user has access to
   */
  private async getUserTeamIds(user: UserWithRole): Promise<string[]> {
    const roleType = user.role?.name as RoleType;

    if (roleType === ROLE_TYPES.ADMIN_MANAGER) {
      // Admin has access to all teams
      const allTeams = await prisma.team.findMany({ select: { id: true } });
      return allTeams.map(team => team.id);
    } else if (roleType === ROLE_TYPES.TEAM_LEADER) {
      // Team leaders have access to teams they lead plus their own team
      const teamIds = user.teamLeaderships.map(tl => tl.teamId);
      if (user.teamId) {
        teamIds.push(user.teamId);
      }
      return Array.from(new Set(teamIds)); // Remove duplicates
    } else {
      // Regular users only have access to their own team
      return user.teamId ? [user.teamId] : [];
    }
  }

  /**
   * Validate scope-based access for a specific permission
   */
  private async validateScopeAccess(
    user: UserWithRole,
    scope: PermissionScope,
    targetUserId?: string,
    teamId?: string
  ): Promise<boolean> {
    const roleType = user.role?.name as RoleType;

    switch (scope) {
      case 'own':
        // User can only access their own resources
        if (targetUserId) {
          return targetUserId === user.id;
        }
        if (teamId) {
          return teamId === user.teamId;
        }
        return true;

      case 'team':
        // User can access resources within their team scope
        const userTeamIds = await this.getUserTeamIds(user);
        
        if (targetUserId) {
          const targetUser = await this.getUserWithRole(targetUserId);
          return targetUser?.teamId ? userTeamIds.includes(targetUser.teamId) : false;
        }
        
        if (teamId) {
          return userTeamIds.includes(teamId);
        }
        
        return true;

      case 'organization':
        // Check if user has organization-wide access
        return roleType === ROLE_TYPES.ADMIN_MANAGER;

      default:
        return false;
    }
  }

  /**
   * Get default access scope (no permissions)
   */
  private getDefaultAccessScope(): AccessScope {
    return {
      canViewUsers: false,
      canEditUsers: false,
      canCreateUsers: false,
      canDeleteUsers: false,
      canManageRoles: false,
      canManageTeams: false,
      teamIds: [],
      organizationWide: false,
    };
  }
}

// Export singleton instance
export const permissionEngine = new PermissionEngine();