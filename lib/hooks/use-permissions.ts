'use client';

import { useMemo } from 'react';
import { useAuth, UserRole } from '@/lib/contexts/auth-context';

export interface Ticket {
  id: string;
  assignedToId?: string | null;
  createdById?: string | null;
  teamId?: string | null;
  [key: string]: any;
}

export interface UsePermissionsReturn {
  canAssignTicket: (ticket?: Ticket) => boolean;
  canViewAnalytics: () => boolean;
  canManageSLA: () => boolean;
  canCreateTicket: () => boolean;
  canEditTicket: (ticket?: Ticket) => boolean;
  canDeleteTicket: (ticket?: Ticket) => boolean;
  canViewOrganizationAnalytics: () => boolean;
  canViewTeamAnalytics: () => boolean;
  canManageEscalation: () => boolean;
  canManageUsers: () => boolean;
  canManageTeams: () => boolean;
  canViewAllTickets: () => boolean;
  canViewTeamTickets: () => boolean;
  canAddInternalNotes: () => boolean;
  hasRole: (role: UserRole) => boolean;
}

/**
 * Hook that provides role-based permission checking functions
 * Permissions are based on the user's role from AuthContext
 */
export function usePermissions(): UsePermissionsReturn {
  const { user, role } = useAuth();

  // Memoize permission functions to prevent unnecessary recalculations
  const permissions = useMemo(() => {
    const hasRole = (requiredRole: UserRole): boolean => {
      return role === requiredRole;
    };

    const isAdminManager = hasRole('Admin/Manager');
    const isTeamLeader = hasRole('Team Leader');
    const isUserEmployee = hasRole('User/Employee');

    return {
      /**
       * Check if user has a specific role
       */
      hasRole,

      /**
       * Check if user can assign tickets
       * Admin_Manager: Can assign any ticket to anyone
       * Team_Leader: Can assign team tickets to team members
       * User_Employee: Cannot assign tickets
       */
      canAssignTicket: (ticket?: Ticket): boolean => {
        if (isAdminManager) return true;
        if (isTeamLeader) {
          // Team leaders can assign tickets within their team
          if (!ticket) return true; // General permission check
          return ticket.teamId === user?.teamId;
        }
        return false;
      },

      /**
       * Check if user can view analytics
       * Admin_Manager: Can view organization analytics
       * Team_Leader: Can view team analytics
       * User_Employee: Cannot view analytics dashboards
       */
      canViewAnalytics: (): boolean => {
        return isAdminManager || isTeamLeader;
      },

      /**
       * Check if user can view organization-wide analytics
       * Only Admin_Manager can view organization analytics
       */
      canViewOrganizationAnalytics: (): boolean => {
        return isAdminManager;
      },

      /**
       * Check if user can view team analytics
       * Admin_Manager: Can view all team analytics
       * Team_Leader: Can view their own team analytics
       * User_Employee: Cannot view team analytics
       */
      canViewTeamAnalytics: (): boolean => {
        return isAdminManager || isTeamLeader;
      },

      /**
       * Check if user can manage SLA policies
       * Only Admin_Manager can manage SLA policies
       */
      canManageSLA: (): boolean => {
        return isAdminManager;
      },

      /**
       * Check if user can manage escalation rules
       * Only Admin_Manager can manage escalation rules
       */
      canManageEscalation: (): boolean => {
        return isAdminManager;
      },

      /**
       * Check if user can create tickets
       * All authenticated users can create tickets
       */
      canCreateTicket: (): boolean => {
        return !!user;
      },

      /**
       * Check if user can edit a ticket
       * Admin_Manager: Can edit any ticket
       * Team_Leader: Can edit team tickets
       * User_Employee: Can edit their own tickets
       */
      canEditTicket: (ticket?: Ticket): boolean => {
        if (!user) return false;
        if (isAdminManager) return true;
        if (isTeamLeader) {
          if (!ticket) return true; // General permission check
          return ticket.teamId === user.teamId;
        }
        if (isUserEmployee) {
          if (!ticket) return false;
          return ticket.createdById === user.id;
        }
        return false;
      },

      /**
       * Check if user can delete a ticket
       * Admin_Manager: Can delete any ticket
       * Team_Leader: Can delete team tickets
       * User_Employee: Cannot delete tickets
       */
      canDeleteTicket: (ticket?: Ticket): boolean => {
        if (isAdminManager) return true;
        if (isTeamLeader) {
          if (!ticket) return true; // General permission check
          return ticket.teamId === user?.teamId;
        }
        return false;
      },

      /**
       * Check if user can manage users
       * Only Admin_Manager can manage users
       */
      canManageUsers: (): boolean => {
        return isAdminManager;
      },

      /**
       * Check if user can manage teams
       * Only Admin_Manager can manage teams
       */
      canManageTeams: (): boolean => {
        return isAdminManager;
      },

      /**
       * Check if user can view all tickets in the organization
       * Only Admin_Manager can view all tickets
       */
      canViewAllTickets: (): boolean => {
        return isAdminManager;
      },

      /**
       * Check if user can view team tickets
       * Admin_Manager: Can view all tickets
       * Team_Leader: Can view their team's tickets
       * User_Employee: Can only view their own tickets
       */
      canViewTeamTickets: (): boolean => {
        return isAdminManager || isTeamLeader;
      },

      /**
       * Check if user can add internal notes to tickets
       * Admin_Manager: Can add internal notes
       * Team_Leader: Can add internal notes
       * User_Employee: Cannot add internal notes
       */
      canAddInternalNotes: (): boolean => {
        return isAdminManager || isTeamLeader;
      },
    };
  }, [user, role]);

  return permissions;
}
