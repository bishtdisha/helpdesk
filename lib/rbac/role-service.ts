import { prisma } from '../db';
import {
  Role,
  Team,
  UserWithRole,
  TeamWithMembers,
  RoleAssignmentData,
  TeamAssignmentData,
  RoleType,
} from '../types/rbac';
import {
  UserNotFoundError,
  TeamNotFoundError,
  RoleNotFoundError,
  RoleAssignmentDeniedError,
  TeamAccessDeniedError,
  InsufficientPermissionsError,
} from './errors';
import { permissionEngine } from './permission-engine';
import { auditLogger } from './audit-logger';
import {
  PERMISSION_ACTIONS,
  RESOURCE_TYPES,
  ROLE_TYPES,
} from './permissions';
import { rbacCache } from './cache';

/**
 * Role Management Service - Handles role and team assignment operations
 * 
 * This service provides methods for managing user roles and team assignments
 * with proper permission validation and audit logging.
 */
export class RoleService {
  /**
   * Assign a role to a user
   * 
   * @param assignerId - ID of the user performing the assignment (must have permission)
   * @param userId - ID of the user to assign the role to
   * @param roleId - ID of the role to assign
   * @throws RoleAssignmentDeniedError if assigner lacks permission
   * @throws UserNotFoundError if user doesn't exist
   * @throws RoleNotFoundError if role doesn't exist
   */
  async assignRole(assignerId: string, userId: string, roleId: string): Promise<void> {
    // Validate permission to assign roles
    await permissionEngine.requirePermission(
      assignerId,
      PERMISSION_ACTIONS.ASSIGN,
      RESOURCE_TYPES.ROLES
    );

    // Validate that the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // Validate that the role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new RoleNotFoundError(roleId);
    }

    // Update user's role
    await prisma.user.update({
      where: { id: userId },
      data: { roleId },
    });

    // Invalidate user cache since role changed
    await rbacCache.invalidateUserCache(userId);

    // Log the role assignment
    await auditLogger.logRoleAssignment(
      assignerId,
      userId,
      'assign_role',
      {
        previousRoleId: user.roleId,
        newRoleId: roleId,
        roleName: role.name,
      }
    );
  }

  /**
   * Assign a user to a team
   * 
   * @param assignerId - ID of the user performing the assignment
   * @param userId - ID of the user to assign to the team
   * @param teamId - ID of the team to assign the user to
   * @throws TeamAccessDeniedError if assigner lacks permission
   * @throws UserNotFoundError if user doesn't exist
   * @throws TeamNotFoundError if team doesn't exist
   */
  async assignToTeam(assignerId: string, userId: string, teamId: string): Promise<void> {
    // Check if assigner can manage teams or has team-specific permissions
    const canManageTeams = await permissionEngine.checkPermission(
      assignerId,
      PERMISSION_ACTIONS.MANAGE,
      RESOURCE_TYPES.TEAMS
    );

    const canAccessTeam = await permissionEngine.canAccessTeamData(assignerId, teamId);

    if (!canManageTeams && !canAccessTeam) {
      throw new TeamAccessDeniedError(teamId, assignerId);
    }

    // Validate that the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // Validate that the team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    // Update user's team assignment
    await prisma.user.update({
      where: { id: userId },
      data: { teamId },
    });

    // Invalidate user and team cache since assignment changed
    await rbacCache.invalidateUserCache(userId);
    await rbacCache.invalidateTeamCache(teamId);
    if (user.teamId) {
      await rbacCache.invalidateTeamCache(user.teamId);
    }

    // Log the team assignment
    await auditLogger.logRoleAssignment(
      assignerId,
      userId,
      'assign_team',
      {
        previousTeamId: user.teamId,
        newTeamId: teamId,
        teamName: team.name,
      }
    );
  }

  /**
   * Remove a user from a team
   * 
   * @param removerId - ID of the user performing the removal
   * @param userId - ID of the user to remove from the team
   * @param teamId - ID of the team to remove the user from
   * @throws TeamAccessDeniedError if remover lacks permission
   * @throws UserNotFoundError if user doesn't exist
   * @throws TeamNotFoundError if team doesn't exist
   */
  async removeFromTeam(removerId: string, userId: string, teamId: string): Promise<void> {
    // Check if remover can manage teams or has team-specific permissions
    const canManageTeams = await permissionEngine.checkPermission(
      removerId,
      PERMISSION_ACTIONS.MANAGE,
      RESOURCE_TYPES.TEAMS
    );

    const canAccessTeam = await permissionEngine.canAccessTeamData(removerId, teamId);

    if (!canManageTeams && !canAccessTeam) {
      throw new TeamAccessDeniedError(teamId, removerId);
    }

    // Validate that the user exists and is in the specified team
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (user.teamId !== teamId) {
      throw new TeamAccessDeniedError(teamId, userId);
    }

    // Validate that the team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    // Remove user from team (set teamId to null)
    await prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
    });

    // Also remove any team leadership assignments for this team
    await prisma.teamLeader.deleteMany({
      where: {
        userId,
        teamId,
      },
    });

    // Invalidate user and team cache since assignment changed
    await rbacCache.invalidateUserCache(userId);
    await rbacCache.invalidateTeamCache(teamId);

    // Log the team removal
    await auditLogger.logRoleAssignment(
      removerId,
      userId,
      'remove_from_team',
      {
        removedFromTeamId: teamId,
        teamName: team.name,
      }
    );
  }

  /**
   * Get a user's role information
   * 
   * @param requesterId - ID of the user requesting the information
   * @param userId - ID of the user whose role to retrieve
   * @returns Promise<Role> - The user's role information
   * @throws UserNotFoundError if user doesn't exist
   * @throws InsufficientPermissionsError if requester lacks permission
   */
  async getUserRole(requesterId: string, userId: string): Promise<Role> {
    // Check if requester can access the user's information
    const canAccessUser = await permissionEngine.canAccessUserData(requesterId, userId);
    
    if (!canAccessUser) {
      throw new InsufficientPermissionsError(
        PERMISSION_ACTIONS.READ,
        RESOURCE_TYPES.USERS,
        'users:read'
      );
    }

    // Get user with role information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (!user.role) {
      throw new RoleNotFoundError('No role assigned');
    }

    return user.role;
  }

  /**
   * Get all teams a user belongs to or leads
   * 
   * @param requesterId - ID of the user requesting the information
   * @param userId - ID of the user whose teams to retrieve
   * @returns Promise<Team[]> - Array of teams the user is associated with
   * @throws UserNotFoundError if user doesn't exist
   * @throws InsufficientPermissionsError if requester lacks permission
   */
  async getUserTeams(requesterId: string, userId: string): Promise<Team[]> {
    // Check if requester can access the user's information
    const canAccessUser = await permissionEngine.canAccessUserData(requesterId, userId);
    
    if (!canAccessUser) {
      throw new InsufficientPermissionsError(
        PERMISSION_ACTIONS.READ,
        RESOURCE_TYPES.USERS,
        'users:read'
      );
    }

    // Try to get from cache first
    const cachedTeams = await rbacCache.getCachedUserTeams(userId);
    if (cachedTeams) {
      return cachedTeams;
    }

    // Get user with team information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: true,
        teamLeaderships: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const teams: Team[] = [];

    // Add the user's primary team if they have one
    if (user.team) {
      teams.push(user.team);
    }

    // Add teams the user leads (avoid duplicates)
    for (const leadership of user.teamLeaderships) {
      if (!teams.find(team => team.id === leadership.team.id)) {
        teams.push(leadership.team);
      }
    }

    // Cache the result
    await rbacCache.cacheUserTeams(userId, teams);

    return teams;
  }

  /**
   * Assign team leadership to a user
   * 
   * @param assignerId - ID of the user performing the assignment
   * @param userId - ID of the user to assign as team leader
   * @param teamId - ID of the team to assign leadership for
   * @throws TeamAccessDeniedError if assigner lacks permission
   * @throws UserNotFoundError if user doesn't exist
   * @throws TeamNotFoundError if team doesn't exist
   */
  async assignTeamLeadership(assignerId: string, userId: string, teamId: string): Promise<void> {
    // Only admins can assign team leadership
    await permissionEngine.requirePermission(
      assignerId,
      PERMISSION_ACTIONS.MANAGE,
      RESOURCE_TYPES.TEAMS
    );

    // Validate that the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // Validate that the team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    // Check if user has appropriate role for team leadership
    if (user.role?.name !== ROLE_TYPES.TEAM_LEADER && user.role?.name !== ROLE_TYPES.ADMIN_MANAGER) {
      throw new RoleAssignmentDeniedError(
        user.roleId || 'unknown',
        userId
      );
    }

    // Create team leadership assignment (upsert to handle duplicates)
    await prisma.teamLeader.upsert({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      update: {
        assignedAt: new Date(),
      },
      create: {
        userId,
        teamId,
        assignedAt: new Date(),
      },
    });

    // Log the team leadership assignment
    await auditLogger.logRoleAssignment(
      assignerId,
      userId,
      'assign_team_leadership',
      {
        leaderId: userId,
        teamName: team.name,
        teamId: teamId,
      }
    );
  }

  /**
   * Remove team leadership from a user
   * 
   * @param removerId - ID of the user performing the removal
   * @param userId - ID of the user to remove team leadership from
   * @param teamId - ID of the team to remove leadership for
   * @throws TeamAccessDeniedError if remover lacks permission
   * @throws UserNotFoundError if user doesn't exist
   * @throws TeamNotFoundError if team doesn't exist
   */
  async removeTeamLeadership(removerId: string, userId: string, teamId: string): Promise<void> {
    // Only admins can remove team leadership
    await permissionEngine.requirePermission(
      removerId,
      PERMISSION_ACTIONS.MANAGE,
      RESOURCE_TYPES.TEAMS
    );

    // Validate that the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // Validate that the team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    // Remove team leadership assignment
    await prisma.teamLeader.deleteMany({
      where: {
        userId,
        teamId,
      },
    });

    // Log the team leadership removal
    await auditLogger.logRoleAssignment(
      removerId,
      userId,
      'remove_team_leadership',
      {
        removedLeaderId: userId,
        teamName: team.name,
        teamId: teamId,
      }
    );
  }

  /**
   * Get all users with a specific role
   * 
   * @param requesterId - ID of the user requesting the information
   * @param roleId - ID of the role to filter by
   * @returns Promise<UserWithRole[]> - Array of users with the specified role
   * @throws RoleNotFoundError if role doesn't exist
   * @throws InsufficientPermissionsError if requester lacks permission
   */
  async getUsersByRole(requesterId: string, roleId: string): Promise<UserWithRole[]> {
    // Check if requester can view users
    await permissionEngine.requirePermission(
      requesterId,
      PERMISSION_ACTIONS.READ,
      RESOURCE_TYPES.USERS
    );

    // Validate that the role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new RoleNotFoundError(roleId);
    }

    // Get users with the specified role
    const users = await prisma.user.findMany({
      where: { roleId },
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

    return users;
  }


}

// Export singleton instance
export const roleService = new RoleService();