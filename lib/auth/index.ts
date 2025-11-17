/**
 * Authentication and Authorization Infrastructure
 * 
 * This module provides the core authentication and authorization functionality
 * for the ticket system frontend.
 */

// Context and hooks
export { AuthProvider, useAuth } from '../contexts/auth-context';
export type { User, UserRole } from '../contexts/auth-context';

// Permissions
export { usePermissions } from '../hooks/use-permissions';
export type { UsePermissionsReturn, Ticket } from '../hooks/use-permissions';

// Components
export { PermissionGuard, withPermission } from '../components/permission-guard';
export type { Permission, PermissionGuardProps } from '../components/permission-guard';
