import { NextRequest, NextResponse } from 'next/server';
import {
  withRBAC,

  RBACRequest,
  MiddlewareConfig,
  extractUserIdFromPath,
  extractTeamIdFromPath,

} from './middleware';
import { handlePermissionError, PermissionError } from './errors';

// Type for API route handlers
export type APIRouteHandler = (
  request: RBACRequest,
  context?: { params?: any }
) => Promise<NextResponse> | NextResponse;

// Type for protected API route handlers with additional context
export type ProtectedAPIRouteHandler = (
  request: RBACRequest,
  context: {
    params?: any;
    scopeFilter?: any;
    user: NonNullable<RBACRequest['user']>;
    accessScope: NonNullable<RBACRequest['accessScope']>;
  }
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function to create protected API routes with RBAC
 * This function wraps API route handlers with authentication and authorization
 */
export function createProtectedRoute(
  handler: ProtectedAPIRouteHandler,
  config: MiddlewareConfig = {}
): APIRouteHandler {
  return async (request: NextRequest, context?: { params?: any }) => {
    const rbacRequest = request as RBACRequest;


    try {
      // Set default configuration
      const finalConfig: MiddlewareConfig = {
        requireAuth: true,

        ...config,
      };

      // Apply RBAC middleware
      const rbacResult = await withRBAC(rbacRequest, finalConfig);
      
      if (rbacResult.response) {
        // RBAC check failed, return error response
        

        
        return rbacResult.response;
      }

      // Ensure user and accessScope are available (they should be after successful RBAC)
      if (!rbacResult.request.user || !rbacResult.request.accessScope) {
        throw new Error('User or access scope not available after RBAC middleware');
      }

      // Call the actual handler with enhanced context
      const response = await handler(rbacResult.request, {
        ...context,
        scopeFilter: rbacResult.scopeFilter,
        user: rbacResult.request.user,
        accessScope: rbacResult.request.accessScope,
      });



      return response;
    } catch (error) {
      console.error('Protected route error:', error);
      

      


      // Return appropriate error response
      if (error instanceof PermissionError) {
        return NextResponse.json(
          handlePermissionError(error),
          { status: error.statusCode }
        );
      }

      return NextResponse.json(
        handlePermissionError(error),
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function to create API routes with optional authentication
 * This is useful for routes that may have different behavior for authenticated vs unauthenticated users
 */
export function createOptionalAuthRoute(
  handler: APIRouteHandler,
  config: Omit<MiddlewareConfig, 'requireAuth'> = {}
): APIRouteHandler {
  return async (request: NextRequest, context?: { params?: any }) => {
    const rbacRequest = request as RBACRequest;

    try {
      // Set configuration to not require auth
      const finalConfig: MiddlewareConfig = {
        requireAuth: false,
        ...config,
      };

      // Apply authentication middleware (but don't fail if no auth)
      const rbacResult = await withRBAC(rbacRequest, finalConfig);
      
      if (rbacResult.response) {
        return rbacResult.response;
      }

      // Call the handler
      return await handler(rbacResult.request, context);
    } catch (error) {
      console.error('Optional auth route error:', error);
      
      if (error instanceof PermissionError) {
        return NextResponse.json(
          handlePermissionError(error),
          { status: error.statusCode }
        );
      }

      return NextResponse.json(
        handlePermissionError(error),
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware for user management endpoints
 * Provides specific configurations for user-related operations
 */
export function createUserManagementRoute(
  handler: ProtectedAPIRouteHandler,
  action: 'create' | 'read' | 'update' | 'delete' | 'assign'
): APIRouteHandler {
  const config: MiddlewareConfig = {
    requiredPermission: {
      action,
      resource: 'users',
    },

  };

  // Special handling for user creation and deletion (Admin only)
  if (action === 'create' || action === 'delete') {
    config.allowedRoles = ['Admin/Manager'];
  }

  return createProtectedRoute(handler, config);
}

/**
 * Middleware for team management endpoints
 * Provides specific configurations for team-related operations
 */
export function createTeamManagementRoute(
  handler: ProtectedAPIRouteHandler,
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
): APIRouteHandler {
  const config: MiddlewareConfig = {
    requiredPermission: {
      action,
      resource: 'teams',
    },
    auditAction: `${action}_team`,
  };

  // Special handling for team creation, update, and deletion (Admin only)
  if (action === 'create' || action === 'update' || action === 'delete') {
    config.allowedRoles = ['Admin/Manager'];
  }

  return createProtectedRoute(handler, config);
}

/**
 * Middleware for role management endpoints
 * Provides specific configurations for role-related operations
 */
export function createRoleManagementRoute(
  handler: ProtectedAPIRouteHandler,
  action: 'create' | 'read' | 'update' | 'delete' | 'assign'
): APIRouteHandler {
  const config: MiddlewareConfig = {
    requiredPermission: {
      action,
      resource: 'roles',
    },
    allowedRoles: ['Admin/Manager'], // Only admins can manage roles
    auditAction: `${action}_role`,
  };

  return createProtectedRoute(handler, config);
}

/**
 * Middleware for self-profile management
 * Allows users to manage their own profile with limited permissions
 */
export function createSelfProfileRoute(
  handler: ProtectedAPIRouteHandler
): APIRouteHandler {
  return createProtectedRoute(async (request, context) => {
    // Ensure the user is only accessing their own profile
    const userId = extractUserIdFromPath(new URL(request.url).pathname);
    
    if (userId && userId !== 'me' && userId !== context.user.id) {
      return NextResponse.json(
        handlePermissionError(new Error('Can only access own profile')),
        { status: 403 }
      );
    }

    return handler(request, context);
  }, {
    auditAction: 'update_own_profile',
  });
}

/**
 * Helper function to extract resource ID from request
 * This is used for audit logging to identify which specific resource was accessed
 */
function extractResourceId(request: NextRequest): string | undefined {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Try to extract user ID
  const userId = extractUserIdFromPath(pathname);
  if (userId && userId !== 'me') {
    return userId;
  }

  // Try to extract team ID
  const teamId = extractTeamIdFromPath(pathname);
  if (teamId) {
    return teamId;
  }

  // Try to extract role ID
  const roleIdMatch = pathname.match(/\/api\/roles\/([^\/]+)/);
  if (roleIdMatch) {
    return roleIdMatch[1];
  }

  return undefined;
}

/**
 * Helper function to validate request body against expected schema
 * This can be extended to use a validation library like Zod
 */
export function validateRequestBody<T>(
  body: any,
  requiredFields: (keyof T)[],
  optionalFields: (keyof T)[] = []
): { isValid: boolean; errors: string[]; data?: T } {
  const errors: string[] = [];
  
  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object'] };
  }

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in body) || body[field] === undefined || body[field] === null) {
      errors.push(`Missing required field: ${String(field)}`);
    }
  }

  // Check for unexpected fields
  const allowedFields = [...requiredFields, ...optionalFields];
  for (const key in body) {
    if (!allowedFields.includes(key as keyof T)) {
      errors.push(`Unexpected field: ${key}`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [], data: body as T };
}

/**
 * Helper function to create paginated responses
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Helper function to parse pagination parameters from request
 */
export function parsePaginationParams(request: NextRequest): { page: number; limit: number } {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)));
  
  return { page, limit };
}

/**
 * Helper function to parse filter parameters from request
 */
export function parseFilterParams(request: NextRequest): Record<string, string> {
  const url = new URL(request.url);
  const filters: Record<string, string> = {};
  
  // Common filter parameters
  const filterParams = ['search', 'roleId', 'teamId', 'isActive', 'status'];
  
  for (const param of filterParams) {
    const value = url.searchParams.get(param);
    if (value !== null) {
      filters[param] = value;
    }
  }
  
  return filters;
}