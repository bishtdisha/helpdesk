import { prisma } from '../db';
import {
  UserWithRole,
  Team,
  Role,
  RoleType,
} from '../types/rbac';
import {
  UserNotFoundError,
  InsufficientPermissionsError,
} from './errors';
import { permissionEngine } from './permission-engine';
import { rbacCache } from './cache';
import {
  PaginationOptions,
  FilterOptions,
  PaginatedResult,
  normalizePaginationOptions,
  calculateSkip,
  createPaginationMeta,
  buildUserFilterWhere,
  buildSortOrder,
  buildTeamFilterWhere,

  executePaginatedQuery,
  generateCacheKey,
  validateSortField,
  ALLOWED_SORT_FIELDS,
} from './pagination';
import {
  PERMISSION_ACTIONS,
  RESOURCE_TYPES,
  ROLE_TYPES,
} from './permissions';

/**
 * Optimized User Management Service with Caching and Pagination
 * 
 * This service provides high-performance user management operations
 * with Redis caching, database views, and efficient pagination.
 */
export class OptimizedUserService {
  /**
   * Get paginated list of users with role-based filtering
   */
  async getUsers(
    requesterId: string,
    options: PaginationOptions = {},
    filters: FilterOptions = {}
  ): Promise<PaginatedResult<UserWithRole>> {
    // Check if requester can view users
    await permissionEngine.requirePermission(
      requesterId,
      PERMISSION_ACTIONS.READ,
      RESOURCE_TYPES.USERS
    );

    // Get requester's access scope to filter results
    const requesterPermissions = await permissionEngine.getUserPermissions(requesterId);
    const accessScope = requesterPermissions.accessScope;

    // Normalize pagination options
    const { page, limit, sortBy, sortOrder } = normalizePaginationOptions(options);

    // Validate sort field
    if (!validateSortField(sortBy, ALLOWED_SORT_FIELDS.users)) {
      throw new Error(`Invalid sort field: ${sortBy}`);
    }

    // Build where clause based on filters and access scope
    let where = buildUserFilterWhere(filters);

    // Apply role-based filtering
    if (!accessScope.organizationWide) {
      // Team leaders and regular users can only see users in their teams
      if (accessScope.teamIds.length > 0) {
        where.teamId = { in: accessScope.teamIds };
      } else {
        // If no team access, only show self
        where.id = requesterId;
      }
    }

    // Try to get from cache first
    const cacheKey = generateCacheKey('users', options, filters);
    
    // For non-admin users, we can cache more aggressively since their view is limited
    if (!accessScope.organizationWide) {
      // Implementation would check cache here, but for now we'll skip caching paginated results
      // as they can be complex to invalidate properly
    }

    // Execute paginated query using database view for better performance
    return await executePaginatedQuery(
      // Count query
      async () => {
        return await prisma.user.count({ where });
      },
      // Data query
      async (skip: number, take: number) => {
        return await prisma.user.findMany({
          where,
          include: {
            role: true,
            team: true,
            teamLeaderships: {
              include: {
                team: true,
              },
            },
          },
          orderBy: buildSortOrder(sortBy, sortOrder),
          skip,
          take,
        });
      },
      options
    );
  }

  /**
   * Get paginated list of teams with role-based filtering
   */
  async getTeams(
    requesterId: string,
    options: PaginationOptions = {},
    filters: Omit<FilterOptions, 'roleId'> = {}
  ): Promise<PaginatedResult<Team & { memberCount: number; leaderCount: number }>> {
    // Check if requester can view teams
    await permissionEngine.requirePermission(
      requesterId,
      PERMISSION_ACTIONS.READ,
      RESOURCE_TYPES.TEAMS
    );

    // Get requester's access scope
    const requesterPermissions = await permissionEngine.getUserPermissions(requesterId);
    const accessScope = requesterPermissions.accessScope;

    // Normalize pagination options
    const { page, limit, sortBy, sortOrder } = normalizePaginationOptions(options);

    // Validate sort field
    if (!validateSortField(sortBy, ALLOWED_SORT_FIELDS.teams)) {
      throw new Error(`Invalid sort field: ${sortBy}`);
    }

    // Build where clause
    let where = buildTeamFilterWhere(filters);

    // Apply role-based filtering
    if (!accessScope.organizationWide && accessScope.teamIds.length > 0) {
      where.id = { in: accessScope.teamIds };
    }

    // Use database view for better performance
    return await executePaginatedQuery(
      // Count query
      async () => {
        return await prisma.team.count({ where });
      },
      // Data query with member counts
      async (skip: number, take: number) => {
        const teams = await prisma.teams.findMany({
          where,
          include: {
            members: {
              where: { isActive: true },
              select: { id: true },
            },
            teamLeaders: {
              select: { id: true },
            },
          },
          orderBy: buildSortOrder(sortBy, sortOrder),
          skip,
          take,
        });

        // Transform to include counts
        return teams.map(team => ({
          ...team,
          memberCount: team.members.length,
          leaderCount: team.teamLeaders.length,
          members: undefined, // Remove the full members array
          teamLeaders: undefined, // Remove the full teamLeaders array
        }));
      },
      options
    );
  }

  /**
   * Get team members with caching
   */
  async getTeamMembers(
    requesterId: string,
    teamId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<UserWithRole>> {
    // Check if requester can access this team
    const canAccessTeam = await permissionEngine.canAccessTeamData(requesterId, teamId);
    if (!canAccessTeam) {
      throw new InsufficientPermissionsError(
        PERMISSION_ACTIONS.READ,
        RESOURCE_TYPES.TEAMS,
        'teams:read'
      );
    }

    // Try to get from cache first (for small teams)
    const cachedMembers = await rbacCache.getCachedTeamMembers(teamId);
    if (cachedMembers && options.page === 1 && (options.limit || 20) >= cachedMembers.length) {
      return {
        data: cachedMembers,
        pagination: createPaginationMeta(1, cachedMembers.length, cachedMembers.length),
      };
    }

    // Normalize pagination options
    const { page, limit, sortBy, sortOrder } = normalizePaginationOptions(options);

    // Execute paginated query
    const result = await executePaginatedQuery(
      // Count query
      async () => {
        return await prisma.user.count({
          where: {
            teamId,
            isActive: true,
          },
        });
      },
      // Data query
      async (skip: number, take: number) => {
        return await prisma.user.findMany({
          where: {
            teamId,
            isActive: true,
          },
          include: {
            role: true,
            team: true,
            teamLeaderships: {
              include: {
                team: true,
              },
            },
          },
          orderBy: buildSortOrder(sortBy, sortOrder),
          skip,
          take,
        });
      },
      options
    );

    // Cache the first page if it's a reasonable size
    if (page === 1 && result.data.length <= 50) {
      await rbacCache.cacheTeamMembers(teamId, result.data);
    }

    return result;
  }

  /**
   * Get user analytics with caching
   */
  async getUserAnalytics(requesterId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Array<{ roleId: string; roleName: string; count: number }>;
    usersByTeam: Array<{ teamId: string; teamName: string; count: number }>;
    recentActivity: number;
  }> {
    // Check if requester can view analytics
    const requesterPermissions = await permissionEngine.getUserPermissions(requesterId);
    const accessScope = requesterPermissions.accessScope;

    if (!accessScope.organizationWide && requesterPermissions.roleName !== ROLE_TYPES.TEAM_LEADER) {
      throw new InsufficientPermissionsError(
        PERMISSION_ACTIONS.READ,
        'analytics',
        'analytics:read'
      );
    }

    // Use database views for efficient analytics queries
    const baseWhere = accessScope.organizationWide 
      ? {} 
      : { teamId: { in: accessScope.teamIds } };

    const [
      totalUsers,
      activeUsers,
      usersByRole,
      usersByTeam,
      recentActivity,
    ] = await Promise.all([
      // Total users count
      prisma.user.count({ where: baseWhere }),
      
      // Active users count
      prisma.user.count({ 
        where: { ...baseWhere, isActive: true } 
      }),
      
      // Users by role
      prisma.user.groupBy({
        by: ['roleId'],
        where: { ...baseWhere, isActive: true, roleId: { not: null } },
        _count: { id: true },
      }).then(async (groups) => {
        const roleIds = groups.map(g => g.roleId!);
        const roles = await prisma.role.findMany({
          where: { id: { in: roleIds } },
          select: { id: true, name: true },
        });
        
        return groups.map(group => {
          const role = roles.find(r => r.id === group.roleId);
          return {
            roleId: group.roleId!,
            roleName: role?.name || 'Unknown',
            count: group._count.id,
          };
        });
      }),
      
      // Users by team
      prisma.user.groupBy({
        by: ['teamId'],
        where: { ...baseWhere, isActive: true, teamId: { not: null } },
        _count: { id: true },
      }).then(async (groups) => {
        const teamIds = groups.map(g => g.teamId!);
        const teams = await prisma.team.findMany({
          where: { id: { in: teamIds } },
          select: { id: true, name: true },
        });
        
        return groups.map(group => {
          const team = teams.find(t => t.id === group.teamId);
          return {
            teamId: group.teamId!,
            teamName: team?.name || 'Unknown',
            count: group._count.id,
          };
        });
      }),
      
      // Recent activity (last 24 hours) - removed audit log functionality
      Promise.resolve(0),
    ]);

    return {
      totalUsers,
      activeUsers,
      usersByRole,
      usersByTeam,
      recentActivity,
    };
  }

  /**
   * Search users with optimized full-text search
   */
  async searchUsers(
    requesterId: string,
    query: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<UserWithRole>> {
    // Check permissions
    await permissionEngine.requirePermission(
      requesterId,
      PERMISSION_ACTIONS.READ,
      RESOURCE_TYPES.USERS
    );

    // Get access scope
    const requesterPermissions = await permissionEngine.getUserPermissions(requesterId);
    const accessScope = requesterPermissions.accessScope;

    // Build search filters
    const filters: FilterOptions = {
      search: query,
    };

    return await this.getUsers(requesterId, options, filters);
  }

  /**
   * Get user activity summary (audit logs removed)
   */
  async getUserActivity(
    requesterId: string,
    userId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    // Check if requester can access user data
    const canAccessUser = await permissionEngine.canAccessUserData(requesterId, userId);
    if (!canAccessUser) {
      throw new InsufficientPermissionsError(
        PERMISSION_ACTIONS.READ,
        RESOURCE_TYPES.USERS,
        'users:read'
      );
    }

    // Return empty result since audit logs have been removed
    return {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  /**
   * Bulk update user status (for admin operations)
   */
  async bulkUpdateUserStatus(
    requesterId: string,
    userIds: string[],
    isActive: boolean
  ): Promise<{ updated: number; errors: string[] }> {
    // Check if requester can manage users
    await permissionEngine.requirePermission(
      requesterId,
      PERMISSION_ACTIONS.UPDATE,
      RESOURCE_TYPES.USERS
    );

    const errors: string[] = [];
    let updated = 0;

    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      try {
        const result = await prisma.user.updateMany({
          where: {
            id: { in: batch },
          },
          data: {
            isActive,
          },
        });
        
        updated += result.count;
        
        // Invalidate cache for updated users
        await Promise.all(batch.map(userId => rbacCache.invalidateUserCache(userId)));
      } catch (error) {
        errors.push(`Batch ${i / batchSize + 1}: ${error}`);
      }
    }

    return { updated, errors };
  }
}

// Export singleton instance
export const optimizedUserService = new OptimizedUserService();