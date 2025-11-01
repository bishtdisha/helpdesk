// Base permission error class
export class PermissionError extends Error {
  public readonly code: string;
  public readonly requiredPermission?: string;
  public readonly statusCode: number;

  constructor(
    message: string,
    code: string,
    requiredPermission?: string,
    statusCode: number = 403
  ) {
    super(message);
    this.name = 'PermissionError';
    this.code = code;
    this.requiredPermission = requiredPermission;
    this.statusCode = statusCode;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PermissionError);
    }
  }
}

// Specific permission error types
export class InsufficientPermissionsError extends PermissionError {
  constructor(action: string, resource: string, requiredPermission?: string) {
    super(
      `Insufficient permissions to ${action} ${resource}`,
      'INSUFFICIENT_PERMISSIONS',
      requiredPermission,
      403
    );
    this.name = 'InsufficientPermissionsError';
  }
}

export class InvalidScopeError extends PermissionError {
  constructor(scope: string, allowedScopes: string[]) {
    super(
      `Invalid access scope '${scope}'. Allowed scopes: ${allowedScopes.join(', ')}`,
      'INVALID_SCOPE',
      undefined,
      403
    );
    this.name = 'InvalidScopeError';
  }
}

export class TeamAccessDeniedError extends PermissionError {
  constructor(teamId: string, userId: string) {
    super(
      `Access denied to team '${teamId}' for user '${userId}'`,
      'TEAM_ACCESS_DENIED',
      'team:read',
      403
    );
    this.name = 'TeamAccessDeniedError';
  }
}

export class RoleAssignmentDeniedError extends PermissionError {
  constructor(roleId: string, targetUserId: string) {
    super(
      `Permission denied to assign role '${roleId}' to user '${targetUserId}'`,
      'ROLE_ASSIGNMENT_DENIED',
      'roles:assign',
      403
    );
    this.name = 'RoleAssignmentDeniedError';
  }
}

export class UserNotFoundError extends PermissionError {
  constructor(userId: string) {
    super(
      `User with ID '${userId}' not found`,
      'USER_NOT_FOUND',
      undefined,
      404
    );
    this.name = 'UserNotFoundError';
  }
}

export class TeamNotFoundError extends PermissionError {
  constructor(teamId: string) {
    super(
      `Team with ID '${teamId}' not found`,
      'TEAM_NOT_FOUND',
      undefined,
      404
    );
    this.name = 'TeamNotFoundError';
  }
}

export class RoleNotFoundError extends PermissionError {
  constructor(roleId: string) {
    super(
      `Role with ID '${roleId}' not found`,
      'ROLE_NOT_FOUND',
      undefined,
      404
    );
    this.name = 'RoleNotFoundError';
  }
}

export class UnauthorizedActionError extends PermissionError {
  constructor(action: string, resource: string) {
    super(
      `Unauthorized to perform action '${action}' on resource '${resource}'`,
      'UNAUTHORIZED_ACTION',
      `${resource}:${action}`,
      401
    );
    this.name = 'UnauthorizedActionError';
  }
}

export class SessionExpiredError extends PermissionError {
  constructor() {
    super(
      'Session has expired. Please log in again.',
      'SESSION_EXPIRED',
      undefined,
      401
    );
    this.name = 'SessionExpiredError';
  }
}

export class InvalidUserRoleError extends PermissionError {
  constructor(roleId: string) {
    super(
      `Invalid user role '${roleId}'`,
      'INVALID_USER_ROLE',
      undefined,
      400
    );
    this.name = 'InvalidUserRoleError';
  }
}

export class ValidationError extends PermissionError {
  constructor(message: string, field?: string) {
    super(
      message,
      'VALIDATION_ERROR',
      undefined,
      400
    );
    this.name = 'ValidationError';
  }
}

// Error code constants
export const PERMISSION_ERROR_CODES = {
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_SCOPE: 'INVALID_SCOPE',
  TEAM_ACCESS_DENIED: 'TEAM_ACCESS_DENIED',
  ROLE_ASSIGNMENT_DENIED: 'ROLE_ASSIGNMENT_DENIED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TEAM_NOT_FOUND: 'TEAM_NOT_FOUND',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  UNAUTHORIZED_ACTION: 'UNAUTHORIZED_ACTION',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_USER_ROLE: 'INVALID_USER_ROLE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

// Type for error codes
export type PermissionErrorCode = typeof PERMISSION_ERROR_CODES[keyof typeof PERMISSION_ERROR_CODES];

// Error response interface for API responses
export interface PermissionErrorResponse {
  error: string;
  code: PermissionErrorCode;
  message: string;
  requiredPermission?: string;
  allowedActions?: string[];
  statusCode: number;
}

// Helper function to convert permission errors to API responses
export function toErrorResponse(error: PermissionError): PermissionErrorResponse {
  return {
    error: error.name,
    code: error.code as PermissionErrorCode,
    message: error.message,
    requiredPermission: error.requiredPermission,
    statusCode: error.statusCode,
  };
}

// Helper function to check if an error is a permission error
export function isPermissionError(error: unknown): error is PermissionError {
  return error instanceof PermissionError;
}

// Helper function to handle permission errors in API routes
export function handlePermissionError(error: unknown): PermissionErrorResponse {
  if (isPermissionError(error)) {
    return toErrorResponse(error);
  }
  
  // Handle other types of errors
  if (error instanceof Error) {
    return {
      error: 'InternalServerError',
      code: 'INTERNAL_SERVER_ERROR' as PermissionErrorCode,
      message: error.message,
      statusCode: 500,
    };
  }
  
  // Unknown error
  return {
    error: 'UnknownError',
    code: 'UNKNOWN_ERROR' as PermissionErrorCode,
    message: 'An unknown error occurred',
    statusCode: 500,
  };
}