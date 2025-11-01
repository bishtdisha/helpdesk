"use client"

import { Badge } from '@/components/ui/badge';
import { ROLE_TYPES } from '@/lib/rbac/permissions';
import type { RoleType } from '@/lib/types/rbac';

interface UserRoleBadgeProps {
  roleId?: string | null;
  roleName?: string | null;
  className?: string;
}

/**
 * UserRoleBadge component for displaying user roles with appropriate styling
 */
export function UserRoleBadge({ roleId, roleName, className }: UserRoleBadgeProps) {
  // Use roleName if provided, otherwise try to get from roleId
  const role = roleName ? getRoleFromName(roleName) : getUserRole(roleId);

  if (!role) {
    return (
      <Badge variant="secondary" className={className}>
        No Role
      </Badge>
    );
  }

  const { variant, label } = getRoleDisplayInfo(role);

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

/**
 * Helper function to get role type from role name
 */
function getRoleFromName(roleName: string): RoleType | null {
  switch (roleName) {
    case 'Admin/Manager':
      return ROLE_TYPES.ADMIN_MANAGER;
    case 'Team Leader':
      return ROLE_TYPES.TEAM_LEADER;
    case 'User/Employee':
      return ROLE_TYPES.USER_EMPLOYEE;
    default:
      return null;
  }
}

/**
 * Helper function to get role type from roleId (legacy support)
 */
function getUserRole(roleId: string | null): RoleType | null {
  if (!roleId) return null;

  // This is kept for backward compatibility but won't work with UUIDs
  // The component should use roleName instead
  switch (roleId) {
    case '1':
      return ROLE_TYPES.ADMIN_MANAGER;
    case '2':
      return ROLE_TYPES.TEAM_LEADER;
    case '3':
      return ROLE_TYPES.USER_EMPLOYEE;
    default:
      return null;
  }
}

/**
 * Get display information for each role type
 */
function getRoleDisplayInfo(role: RoleType): { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string } {
  switch (role) {
    case ROLE_TYPES.ADMIN_MANAGER:
      return {
        variant: 'destructive', // Red for admin (highest privilege)
        label: 'Admin'
      };
    case ROLE_TYPES.TEAM_LEADER:
      return {
        variant: 'default', // Blue for team leader (medium privilege)
        label: 'Team Leader'
      };
    case ROLE_TYPES.USER_EMPLOYEE:
      return {
        variant: 'secondary', // Gray for user (basic privilege)
        label: 'Employee'
      };
    default:
      return {
        variant: 'outline',
        label: 'Unknown'
      };
  }
}