'use client';

import React, { ReactNode } from 'react';
import { useAuth, UserRole } from '@/lib/contexts/auth-context';
import { usePermissions } from '@/lib/hooks/use-permissions';

export type Permission =
  | 'canAssignTicket'
  | 'canViewAnalytics'
  | 'canManageSLA'
  | 'canCreateTicket'
  | 'canEditTicket'
  | 'canDeleteTicket'
  | 'canViewOrganizationAnalytics'
  | 'canViewTeamAnalytics'
  | 'canManageEscalation'
  | 'canManageUsers'
  | 'canManageTeams'
  | 'canViewAllTickets'
  | 'canViewTeamTickets'
  | 'canAddInternalNotes';

export interface PermissionGuardProps {
  /**
   * Single permission or array of permissions required to render children
   * If array is provided, user must have ALL permissions (AND logic)
   */
  require?: Permission | Permission[];
  
  /**
   * Role or array of roles required to render children
   * If array is provided, user must have ONE of the roles (OR logic)
   */
  requireRole?: UserRole | UserRole[];
  
  /**
   * Fallback content to render when user doesn't have permission
   * If not provided, nothing will be rendered
   */
  fallback?: ReactNode;
  
  /**
   * Children to render when user has permission
   */
  children: ReactNode;
  
  /**
   * Optional ticket data for permission checks that require context
   */
  ticket?: any;
}

/**
 * Component that conditionally renders children based on user permissions
 * 
 * @example
 * // Require single permission
 * <PermissionGuard require="canManageSLA">
 *   <SLAManagementButton />
 * </PermissionGuard>
 * 
 * @example
 * // Require multiple permissions (AND logic)
 * <PermissionGuard require={["canEditTicket", "canAssignTicket"]}>
 *   <TicketEditForm />
 * </PermissionGuard>
 * 
 * @example
 * // Require specific role
 * <PermissionGuard requireRole="Admin_Manager">
 *   <AdminPanel />
 * </PermissionGuard>
 * 
 * @example
 * // Require one of multiple roles (OR logic)
 * <PermissionGuard requireRole={["Admin_Manager", "Team_Leader"]}>
 *   <TeamManagement />
 * </PermissionGuard>
 * 
 * @example
 * // With fallback content
 * <PermissionGuard 
 *   require="canViewAnalytics" 
 *   fallback={<div>Access Denied</div>}
 * >
 *   <AnalyticsDashboard />
 * </PermissionGuard>
 * 
 * @example
 * // With ticket context for permission check
 * <PermissionGuard require="canEditTicket" ticket={ticket}>
 *   <EditButton />
 * </PermissionGuard>
 */
export function PermissionGuard({
  require,
  requireRole,
  fallback = null,
  children,
  ticket,
}: PermissionGuardProps) {
  const { role } = useAuth();
  const permissions = usePermissions();

  // Check role-based access
  if (requireRole) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    const hasRequiredRole = role && roles.includes(role);
    
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission-based access
  if (require) {
    const requiredPermissions = Array.isArray(require) ? require : [require];
    
    // Check if user has all required permissions (AND logic)
    const hasAllPermissions = requiredPermissions.every((permission) => {
      const permissionFn = permissions[permission];
      
      if (typeof permissionFn !== 'function') {
        console.warn(`Permission "${permission}" is not a valid permission function`);
        return false;
      }
      
      // Call permission function with ticket context if provided
      return permissionFn(ticket);
    });
    
    if (!hasAllPermissions) {
      return <>{fallback}</>;
    }
  }

  // User has required permissions, render children
  return <>{children}</>;
}

/**
 * Higher-order component version of PermissionGuard
 * Useful for wrapping entire components
 * 
 * @example
 * const ProtectedComponent = withPermission(MyComponent, {
 *   require: "canManageSLA",
 *   fallback: <AccessDenied />
 * });
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<PermissionGuardProps, 'children'>
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGuard {...guardProps}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}
