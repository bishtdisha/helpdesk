"use client"

import { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { hasPermission, getPermissionsForRole, ROLE_TYPES, getTicketPermissionsForRole } from '@/lib/rbac/permissions';
import type { RoleType, PermissionScope } from '@/lib/types/rbac';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  action?: string;
  resource?: string;
  scope?: PermissionScope;
  fallback?: ReactNode;
  requireRole?: RoleType;
  excludeRoles?: RoleType[];
  showFallback?: boolean;
}

/**
 * PermissionGuard component for conditional UI rendering based on user permissions
 * Hides components when user lacks permission and shows appropriate fallback messages
 * Requirements: 18.1, 18.2, 18.3, 18.4
 */
export function PermissionGuard({
  children,
  action,
  resource,
  scope,
  fallback,
  requireRole,
  excludeRoles,
  showFallback = false,
}: PermissionGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return showFallback ? (
      <>{fallback || <UnauthorizedFallback message="You must be logged in to access this feature." />}</>
    ) : null;
  }

  // Get user's role
  const userRole = getUserRole(user);
  if (!userRole) {
    return showFallback ? (
      <>{fallback || <UnauthorizedFallback message="Your account does not have a valid role assigned." />}</>
    ) : null;
  }

  // Check if role is explicitly excluded (Requirement 18.2, 18.3)
  if (excludeRoles && excludeRoles.includes(userRole)) {
    return showFallback ? (
      <>{fallback || <UnauthorizedFallback message="This feature is not available for your role." />}</>
    ) : null;
  }

  // Check role requirement first if specified (Requirement 18.2)
  if (requireRole) {
    if (userRole !== requireRole) {
      return showFallback ? (
        <>{fallback || <UnauthorizedFallback message={`This feature requires ${requireRole} role.`} />}</>
      ) : null;
    }
    // If only role is required and it matches, render children
    if (!action || !resource) {
      return <>{children}</>;
    }
  }

  // Check permissions if action and resource are specified (Requirement 18.1, 18.4)
  if (action && resource) {
    const userPermissions = getPermissionsForRole(userRole);
    const hasRequiredPermission = hasPermission(userPermissions, action, resource, scope);
    
    if (!hasRequiredPermission) {
      return showFallback ? (
        <>{fallback || <UnauthorizedFallback message="You don't have permission to access this feature." />}</>
      ) : null;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Default fallback component for unauthorized access
 * Requirement 18.4
 */
function UnauthorizedFallback({ message }: { message: string }) {
  return (
    <Alert variant="destructive" className="my-4">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Access Denied</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

/**
 * Helper function to get role type from user object
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

/**
 * Hook to check permissions programmatically
 * Useful for conditional logic in components
 */
export function usePermission(
  action?: string,
  resource?: string,
  scope?: PermissionScope,
  requireRole?: RoleType
): { hasPermission: boolean; userRole: RoleType | null } {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return { hasPermission: false, userRole: null };
  }

  const userRole = getUserRole(user);
  if (!userRole) {
    return { hasPermission: false, userRole: null };
  }

  // Check role requirement
  if (requireRole && userRole !== requireRole) {
    return { hasPermission: false, userRole };
  }

  // Check permissions
  if (action && resource) {
    const userPermissions = getPermissionsForRole(userRole);
    const permitted = hasPermission(userPermissions, action, resource, scope);
    return { hasPermission: permitted, userRole };
  }

  return { hasPermission: true, userRole };
}

/**
 * Hook to check ticket-specific permissions
 * Requirements: 18.1, 18.2, 18.3
 */
export function useTicketPermission() {
  const { user, isAuthenticated } = useAuth();

  const userRole = isAuthenticated && user ? getUserRole(user) : null;
  const ticketPermissions = userRole ? getTicketPermissionsForRole(userRole) : null;

  return {
    userRole,
    ticketPermissions,
    canCreateTicket: ticketPermissions?.tickets.create || false,
    canViewAnalytics: ticketPermissions?.analytics.view !== 'none',
    canManageSLA: ticketPermissions?.sla.manage || false,
    canManageEscalation: ticketPermissions?.escalation.manage || false,
    canExportReports: ticketPermissions?.analytics.export || false,
  };
}
