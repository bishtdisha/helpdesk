"use client"

import { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { hasPermission, getPermissionsForRole, ROLE_TYPES } from '@/lib/rbac/permissions';
import type { RoleType, PermissionScope } from '@/lib/types/rbac';

interface PermissionGateProps {
  children: ReactNode;
  action?: string;
  resource?: string;
  scope?: PermissionScope;
  fallback?: ReactNode;
  requireRole?: RoleType;
  excludeRoles?: RoleType[];
}

/**
 * PermissionGate component for conditional UI rendering based on user permissions
 * Only renders children if the user has the required permission
 * This is a simpler version of PermissionGuard without fallback messages
 */
export function PermissionGate({
  children,
  action,
  resource,
  scope,
  fallback = null,
  requireRole,
  excludeRoles,
}: PermissionGateProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Get user's role
  const userRole = getUserRole(user);
  if (!userRole) {
    return <>{fallback}</>;
  }

  // Check if role is explicitly excluded
  if (excludeRoles && excludeRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  // Check role requirement first if specified
  if (requireRole) {
    if (userRole !== requireRole) {
      return <>{fallback}</>;
    }
    // If only role is required and it matches, render children
    if (!action || !resource) {
      return <>{children}</>;
    }
  }

  // Check permissions if action and resource are specified
  if (action && resource) {
    const userPermissions = getPermissionsForRole(userRole);
    const hasRequiredPermission = hasPermission(userPermissions, action, resource, scope);
    return hasRequiredPermission ? <>{children}</> : <>{fallback}</>;
  }

  // If no specific requirements, render children
  return <>{children}</>;
}

/**
 * Helper function to get role type from user object
 * This uses the role name from the user's role relationship
 */
function getUserRole(user: any): RoleType | null {
  if (!user?.role?.name) return null;
  
  const roleName = user.role.name;
  
  // Match against our defined role types
  switch (roleName) {
    case ROLE_TYPES.ADMIN_MANAGER:
      return ROLE_TYPES.ADMIN_MANAGER;
    case ROLE_TYPES.TEAM_LEADER:
      return ROLE_TYPES.TEAM_LEADER;
    case ROLE_TYPES.USER_EMPLOYEE:
      return ROLE_TYPES.USER_EMPLOYEE;
    default:
      return null;
  }
}