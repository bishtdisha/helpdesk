import { prisma } from '@/lib/db';
import { ROLE_TYPES } from '@/lib/rbac/permissions';
import type { RoleType } from '@/lib/types/rbac';
import { cache } from 'react';

/**
 * Dashboard Helper Functions
 * Provides role-based data filtering for dashboard APIs
 */

export interface DashboardUser {
  id: string;
  role: {
    name: string;
  } | null;
  teamId: string | null;
  teamLeaderships: Array<{
    teamId: string;
  }>;
}

// In-memory cache for dashboard user data (short TTL for request deduplication)
const userCache = new Map<string, { user: DashboardUser | null; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Get user with role and team information for dashboard filtering
 * Uses request-level caching to avoid repeated DB queries
 */
export const getDashboardUser = cache(async (userId: string): Promise<DashboardUser | null> => {
  // Check in-memory cache first
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: {
        select: {
          name: true,
        },
      },
      teamId: true,
      teamLeaderships: {
        select: {
          teamId: true,
        },
      },
    },
  });

  // Cache the result
  userCache.set(userId, { user, timestamp: Date.now() });
  
  return user;
});

/**
 * Get team IDs for a user (including their own team and teams they lead)
 */
export async function getUserTeamIds(userId: string): Promise<string[]> {
  const user = await getDashboardUser(userId);
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

  // Remove duplicates
  return [...new Set(teamIds)];
}

/**
 * Get ticket filter based on user role
 * Admin/Manager: All tickets
 * Team Leader: Only tickets from their teams
 * Employee: Only their own tickets
 */
export async function getTicketFilterForUser(userId: string) {
  const user = await getDashboardUser(userId);
  if (!user || !user.role) {
    return { assignedTo: userId }; // Default to own tickets
  }

  const roleType = user.role.name as RoleType;

  switch (roleType) {
    case ROLE_TYPES.ADMIN_MANAGER:
      // Admin can see all tickets
      return {};

    case ROLE_TYPES.TEAM_LEADER:
      // Team Leader can see tickets from their teams
      const teamIds = await getUserTeamIds(userId);
      if (teamIds.length === 0) {
        // No teams, only see own tickets
        return { assignedTo: userId };
      }
      return {
        OR: [
          { teamId: { in: teamIds } },
          { assignedTo: userId },
        ],
      };

    default:
      // Employee can only see their own tickets
      return {
        OR: [
          { assignedTo: userId },
          { customerId: userId },
        ],
      };
  }
}

/**
 * Get user filter based on user role
 * Admin/Manager: All users
 * Team Leader: Only users from their teams
 * Employee: Only themselves
 */
export async function getUserFilterForUser(userId: string) {
  const user = await getDashboardUser(userId);
  if (!user || !user.role) {
    return { id: userId }; // Default to self
  }

  const roleType = user.role.name as RoleType;

  switch (roleType) {
    case ROLE_TYPES.ADMIN_MANAGER:
      // Admin can see all users
      return {};

    case ROLE_TYPES.TEAM_LEADER:
      // Team Leader can see users from their teams
      const teamIds = await getUserTeamIds(userId);
      if (teamIds.length === 0) {
        return { id: userId };
      }
      return {
        OR: [
          { teamId: { in: teamIds } },
          { id: userId },
        ],
      };

    default:
      // Employee can only see themselves
      return { id: userId };
  }
}

/**
 * Check if user is admin
 */
export function isAdmin(user: DashboardUser | null): boolean {
  return user?.role?.name === ROLE_TYPES.ADMIN_MANAGER;
}

/**
 * Check if user is team leader
 */
export function isTeamLeader(user: DashboardUser | null): boolean {
  return user?.role?.name === ROLE_TYPES.TEAM_LEADER;
}

/**
 * Get user role type
 */
export function getUserRole(user: DashboardUser | null): RoleType | null {
  if (!user?.role?.name) return null;
  return user.role.name as RoleType;
}
