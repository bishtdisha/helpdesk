import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthService } from '../auth-service';
import { permissionEngine } from './permission-engine';
import { roleService } from './role-service';
import { auditLogger } from './audit-logger';
import { prisma } from '../db';
import {
  PermissionError,
  InsufficientPermissionsError,
  SessionExpiredError,
  UnauthorizedActionError,
  handlePermissionError,
} from './errors';
import {
  UserWithRole,
  SafeUserWithRole,
  AuditLogData,
} from '../types/rbac';

// Extended request interface with RBAC context
export interface RBACRequest extends NextRequest {
  user?: SafeUserWithRole;
  permissions?: string[];
  accessScope?: {
    canViewUsers: boolean;
    canEditUsers: boolean;
    canCreateUsers: boolean;
    canDeleteUsers: boolean;
    canManageRoles: boolean;
    canManageTeams: boolean;
    teamIds: string[];
    organizationWide: boolean;
  };
}

// Middleware configuration options
export interface MiddlewareConfig {
  requireAuth?: boolean;
  requiredPermission?: {
    action: string;
    resource: string;
  };
  allowedRoles?: string[];
  auditAction?: string;
  skipAudit?: boolean;
}

/**
 * Authentication middleware that includes role information in requests
 * This middleware validates the session and attaches user and role information to the request
 */
export async function withAuth(
  request: NextRequest,
  config: MiddlewareConfig = {}
): Promise<{ request: RBACRequest; response?: NextResponse }> {
  const rbacRequest = request as RBACRequest;

  try {
    // Get session token from cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken) {
      if (config.requireAuth !== false) {
        return {
          request: rbacRequest,
          response: NextResponse.json(
            handlePermissionError(new UnauthorizedActionError('access', 'protected resource')),
            { status: 401 }
          ),
        };
      }
      return { request: rbacRequest };
    }

    // Validate session and get user with role information
    const sessionValidation = await AuthService.validateSession(sessionToken);

    if (!sessionValidation.valid || !sessionValidation.user) {
      if (config.requireAuth !== false) {
        return {
          request: rbacRequest,
          response: NextResponse.json(
            handlePermissionError(new SessionExpiredError()),
            { status: 401 }
          ),
        };
      }
      return { request: rbacRequest };
    }

    // Get full user information with role and team data
    const userWithRole = await prisma.user.findUnique({
      where: { id: sessionValidation.user.id },
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

    if (!userWithRole) {
      if (config.requireAuth !== false) {
        return {
          request: rbacRequest,
          response: NextResponse.json(
            handlePermissionError(new UnauthorizedActionError('access', 'protected resource')),
            { status: 401 }
          ),
        };
      }
      return { request: rbacRequest };
    }

    // Create safe user object (without password)
    const safeUser: SafeUserWithRole = {
      id: userWithRole.id,
      email: userWithRole.email,
      name: userWithRole.name,
      roleId: userWithRole.roleId,
      teamId: userWithRole.teamId,
      isActive: userWithRole.isActive,
      createdAt: userWithRole.createdAt,
      updatedAt: userWithRole.updatedAt,
      role: userWithRole.role,
      team: userWithRole.team,
      teamLeaderships: userWithRole.teamLeaderships,
    };

    // Get user permissions and access scope
    const userPermissions = await permissionEngine.getUserPermissions(userWithRole.id);

    // Attach user information to request
    rbacRequest.user = safeUser;
    rbacRequest.permissions = userPermissions.permissions.map(p => `${p.resource}:${p.action}`);
    rbacRequest.accessScope = userPermissions.accessScope;

    return { request: rbacRequest };
  } catch (error) {
    console.error('Authentication middleware error:', error);
    
    if (config.requireAuth !== false) {
      return {
        request: rbacRequest,
        response: NextResponse.json(
          handlePermissionError(error),
          { status: error instanceof PermissionError ? error.statusCode : 500 }
        ),
      };
    }
    
    return { request: rbacRequest };
  }
}

/**
 * Permission validation middleware for protecting API endpoints
 * This middleware checks if the authenticated user has the required permissions
 */
export async function withPermission(
  request: RBACRequest,
  config: MiddlewareConfig
): Promise<{ request: RBACRequest; response?: NextResponse }> {
  try {
    // Ensure user is authenticated
    if (!request.user) {
      return {
        request,
        response: NextResponse.json(
          handlePermissionError(new UnauthorizedActionError('access', 'protected resource')),
          { status: 401 }
        ),
      };
    }

    // Check role-based access if specified
    if (config.allowedRoles && config.allowedRoles.length > 0) {
      const userRole = request.user.role?.name;
      if (!userRole || !config.allowedRoles.includes(userRole)) {
        return {
          request,
          response: NextResponse.json(
            handlePermissionError(
              new InsufficientPermissionsError('access', 'resource', `role:${config.allowedRoles.join('|')}`)
            ),
            { status: 403 }
          ),
        };
      }
    }

    // Check specific permission if required
    if (config.requiredPermission) {
      const { action, resource } = config.requiredPermission;
      const hasPermission = await permissionEngine.checkPermission(
        request.user.id,
        action,
        resource
      );

      if (!hasPermission) {
        // Log permission violation
        const ipAddress = request.ip || 
          request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await auditLogger.logPermissionViolation(
          request.user.id,
          action,
          resource,
          undefined,
          `User lacks required permission: ${resource}:${action}`,
          ipAddress,
          userAgent
        );

        return {
          request,
          response: NextResponse.json(
            handlePermissionError(
              new InsufficientPermissionsError(action, resource, `${resource}:${action}`)
            ),
            { status: 403 }
          ),
        };
      }
    }

    return { request };
  } catch (error) {
    console.error('Permission validation middleware error:', error);
    return {
      request,
      response: NextResponse.json(
        handlePermissionError(error),
        { status: error instanceof PermissionError ? error.statusCode : 500 }
      ),
    };
  }
}

/**
 * Scope-based filtering middleware for data access
 * This middleware applies data filtering based on user's access scope
 */
export async function withScopeFiltering(
  request: RBACRequest,
  resourceType: string,
  targetUserId?: string,
  teamId?: string
): Promise<{ request: RBACRequest; response?: NextResponse; scopeFilter?: any }> {
  try {
    // Ensure user is authenticated
    if (!request.user || !request.accessScope) {
      return {
        request,
        response: NextResponse.json(
          handlePermissionError(new UnauthorizedActionError('access', 'protected resource')),
          { status: 401 }
        ),
      };
    }

    const { accessScope, user } = request;

    // Validate access to specific user if targetUserId is provided
    if (targetUserId) {
      const canAccess = await permissionEngine.canAccessUserData(user.id, targetUserId);
      if (!canAccess) {
        return {
          request,
          response: NextResponse.json(
            handlePermissionError(
              new InsufficientPermissionsError('access', 'user', 'users:read')
            ),
            { status: 403 }
          ),
        };
      }
    }

    // Validate access to specific team if teamId is provided
    if (teamId) {
      const canAccess = await permissionEngine.canAccessTeamData(user.id, teamId);
      if (!canAccess) {
        return {
          request,
          response: NextResponse.json(
            handlePermissionError(
              new InsufficientPermissionsError('access', 'team', 'teams:read')
            ),
            { status: 403 }
          ),
        };
      }
    }

    // Generate scope-based filter for database queries
    let scopeFilter: any = {};

    switch (resourceType) {
      case 'users':
        if (!accessScope.organizationWide) {
          if (accessScope.teamIds.length > 0) {
            scopeFilter = {
              OR: [
                { id: user.id }, // User can always see themselves
                { teamId: { in: accessScope.teamIds } }, // Users in accessible teams
              ],
            };
          } else {
            scopeFilter = { id: user.id }; // Only own profile
          }
        }
        // No filter needed for organization-wide access
        break;

      case 'teams':
        if (!accessScope.organizationWide) {
          if (accessScope.teamIds.length > 0) {
            scopeFilter = { id: { in: accessScope.teamIds } };
          } else {
            // No teams accessible
            scopeFilter = { id: 'impossible-id' }; // This will return no results
          }
        }
        // No filter needed for organization-wide access
        break;

      case 'tickets':
        if (!accessScope.organizationWide) {
          if (accessScope.teamIds.length > 0) {
            scopeFilter = {
              OR: [
                { assignedTo: user.id }, // Tickets assigned to user
                { 
                  assignedUser: {
                    teamId: { in: accessScope.teamIds }
                  }
                }, // Tickets assigned to team members
              ],
            };
          } else {
            scopeFilter = { assignedTo: user.id }; // Only own tickets
          }
        }
        // No filter needed for organization-wide access
        break;

      default:
        // For unknown resource types, apply team-based filtering if not organization-wide
        if (!accessScope.organizationWide && accessScope.teamIds.length > 0) {
          scopeFilter = { teamId: { in: accessScope.teamIds } };
        }
        break;
    }

    return { request, scopeFilter };
  } catch (error) {
    console.error('Scope filtering middleware error:', error);
    return {
      request,
      response: NextResponse.json(
        handlePermissionError(error),
        { status: error instanceof PermissionError ? error.statusCode : 500 }
      ),
    };
  }
}

/**
 * Audit logging middleware for tracking permission-sensitive actions
 * This middleware logs user actions for security and compliance purposes
 */
export async function withAuditLogging(
  request: RBACRequest,
  config: MiddlewareConfig,
  resourceId?: string,
  success: boolean = true,
  details?: Record<string, any>
): Promise<void> {
  // Skip audit logging if explicitly disabled
  if (config.skipAudit) {
    return;
  }

  try {
    // Only log if user is authenticated and audit action is specified
    if (!request.user || !config.auditAction) {
      return;
    }

    // Extract request information
    const ipAddress = request.ip || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Determine resource type from audit action or config
    let resourceType = 'unknown';
    if (config.requiredPermission) {
      resourceType = config.requiredPermission.resource;
    } else if (config.auditAction.includes('user')) {
      resourceType = 'user';
    } else if (config.auditAction.includes('team')) {
      resourceType = 'team';
    } else if (config.auditAction.includes('role')) {
      resourceType = 'role';
    }

    // Create audit log entry
    const auditData: AuditLogData = {
      userId: request.user.id,
      action: config.auditAction,
      resourceType,
      resourceId,
      success,
      details: {
        ...details,
        method: request.method,
        url: request.url,
        userRole: request.user.role?.name,
        userTeam: request.user.team?.name,
      },
      ipAddress,
      userAgent,
    };

    // Use the audit logger service
    await auditLogger.logAction(
      auditData.userId!,
      auditData.action,
      auditData.resourceType,
      auditData.resourceId,
      auditData.success,
      auditData.details,
      auditData.ipAddress,
      auditData.userAgent
    );
  } catch (error) {
    // Log audit failures but don't throw - we don't want audit logging to break the main operation
    console.error('Audit logging middleware error:', error);
  }
}

/**
 * Combined middleware function that applies all RBAC protections
 * This is a convenience function that combines authentication, permission checking, and audit logging
 */
export async function withRBAC(
  request: NextRequest,
  config: MiddlewareConfig = {}
): Promise<{ request: RBACRequest; response?: NextResponse; scopeFilter?: any }> {
  // Apply authentication middleware
  const authResult = await withAuth(request, config);
  if (authResult.response) {
    return authResult;
  }

  // Apply permission validation if required
  if (config.requiredPermission || config.allowedRoles) {
    const permissionResult = await withPermission(authResult.request, config);
    if (permissionResult.response) {
      return permissionResult;
    }
  }

  // Apply scope filtering for data access
  let scopeFilter: any = undefined;
  if (config.requiredPermission) {
    const scopeResult = await withScopeFiltering(
      authResult.request,
      config.requiredPermission.resource
    );
    if (scopeResult.response) {
      return scopeResult;
    }
    scopeFilter = scopeResult.scopeFilter;
  }

  return { 
    request: authResult.request, 
    scopeFilter 
  };
}

// Helper function to extract user ID from request path
export function extractUserIdFromPath(pathname: string): string | undefined {
  const userIdMatch = pathname.match(/\/api\/users\/([^\/]+)/);
  return userIdMatch ? userIdMatch[1] : undefined;
}

// Helper function to extract team ID from request path
export function extractTeamIdFromPath(pathname: string): string | undefined {
  const teamIdMatch = pathname.match(/\/api\/teams\/([^\/]+)/);
  return teamIdMatch ? teamIdMatch[1] : undefined;
}

// Helper function to determine audit action from HTTP method and path
export function getAuditAction(method: string, pathname: string): string {
  const isUserPath = pathname.includes('/users');
  const isTeamPath = pathname.includes('/teams');
  const isRolePath = pathname.includes('/roles');

  let resource = 'unknown';
  if (isUserPath) resource = 'user';
  else if (isTeamPath) resource = 'team';
  else if (isRolePath) resource = 'role';

  switch (method) {
    case 'GET':
      return `read_${resource}`;
    case 'POST':
      return `create_${resource}`;
    case 'PUT':
    case 'PATCH':
      return `update_${resource}`;
    case 'DELETE':
      return `delete_${resource}`;
    default:
      return `access_${resource}`;
  }
}