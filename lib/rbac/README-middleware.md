# RBAC Middleware Documentation

This document explains how to use the RBAC middleware components for API protection in the Next.js application.

## Overview

The RBAC middleware system provides four main types of protection:

1. **Authentication Middleware** - Validates sessions and includes role information in requests
2. **Permission Validation Middleware** - Checks if users have required permissions
3. **Scope-based Filtering Middleware** - Applies data access restrictions based on user scope
4. **Audit Logging Middleware** - Tracks permission-sensitive actions for compliance

## Quick Start

### Basic Protected Route

```typescript
import { createProtectedRoute } from '@/lib/rbac';

export const GET = createProtectedRoute(async (request, context) => {
  const { user, accessScope, scopeFilter } = context;
  
  // Your protected logic here
  return NextResponse.json({ message: 'Protected data', user: user.name });
}, {
  requiredPermission: {
    action: 'read',
    resource: 'users',
  },
});
```

### User Management Routes

```typescript
import { createUserManagementRoute } from '@/lib/rbac';

// Create user (Admin only)
export const POST = createUserManagementRoute(async (request, context) => {
  // User creation logic
}, 'create');

// List users (with scope filtering)
export const GET = createUserManagementRoute(async (request, context) => {
  const { scopeFilter } = context;
  
  const users = await prisma.user.findMany({
    where: scopeFilter, // Automatically applies scope-based filtering
  });
  
  return NextResponse.json(users);
}, 'read');
```

## Middleware Components

### 1. Authentication Middleware (`withAuth`)

Validates user sessions and attaches user information to requests.

```typescript
import { withAuth } from '@/lib/rbac/middleware';

const { request: rbacRequest, response } = await withAuth(request, {
  requireAuth: true, // Default: true
});

if (response) {
  return response; // Authentication failed
}

// rbacRequest now has user, permissions, and accessScope
```

### 2. Permission Validation Middleware (`withPermission`)

Checks if users have required permissions for specific actions.

```typescript
import { withPermission } from '@/lib/rbac/middleware';

const { request, response } = await withPermission(rbacRequest, {
  requiredPermission: {
    action: 'create',
    resource: 'users',
  },
  allowedRoles: ['Admin/Manager'], // Optional role restriction
});
```

### 3. Scope-based Filtering Middleware (`withScopeFiltering`)

Applies data access restrictions based on user's role and team assignments.

```typescript
import { withScopeFiltering } from '@/lib/rbac/middleware';

const { request, response, scopeFilter } = await withScopeFiltering(
  rbacRequest,
  'users', // Resource type
  targetUserId, // Optional
  teamId // Optional
);

// Use scopeFilter in database queries
const users = await prisma.user.findMany({
  where: scopeFilter,
});
```

### 4. Audit Logging Middleware (`withAuditLogging`)

Tracks user actions for security and compliance.

```typescript
import { withAuditLogging } from '@/lib/rbac/middleware';

await withAuditLogging(
  rbacRequest,
  {
    auditAction: 'create_user',
    skipAudit: false,
  },
  resourceId, // Optional
  success, // Boolean
  details // Optional additional data
);
```

## API Route Helpers

### High-level Route Creators

#### `createProtectedRoute`

Creates a protected API route with full RBAC support.

```typescript
export const GET = createProtectedRoute(async (request, context) => {
  const { user, accessScope, scopeFilter, params } = context;
  // Your logic here
}, {
  requiredPermission: { action: 'read', resource: 'users' },
  allowedRoles: ['Admin/Manager'],
  auditAction: 'custom_action',
});
```

#### `createUserManagementRoute`

Specialized for user management operations.

```typescript
// Available actions: 'create', 'read', 'update', 'delete', 'assign'
export const POST = createUserManagementRoute(handler, 'create'); // Admin only
export const GET = createUserManagementRoute(handler, 'read'); // Scope-filtered
export const PUT = createUserManagementRoute(handler, 'update'); // Scope-filtered
export const DELETE = createUserManagementRoute(handler, 'delete'); // Admin only
```

#### `createTeamManagementRoute`

Specialized for team management operations.

```typescript
// Available actions: 'create', 'read', 'update', 'delete', 'manage'
export const POST = createTeamManagementRoute(handler, 'create'); // Admin only
export const GET = createTeamManagementRoute(handler, 'read'); // Scope-filtered
```

#### `createSelfProfileRoute`

For user profile self-management.

```typescript
export const PUT = createSelfProfileRoute(async (request, context) => {
  // User can only update their own profile
  // Automatically validates that user is accessing their own data
});
```

### Utility Functions

#### Request Validation

```typescript
import { validateRequestBody } from '@/lib/rbac/api-helpers';

const validation = validateRequestBody<CreateUserData>(
  body,
  ['email', 'name'], // required fields
  ['roleId', 'teamId'] // optional fields
);

if (!validation.isValid) {
  return NextResponse.json({ errors: validation.errors }, { status: 400 });
}
```

#### Pagination

```typescript
import { parsePaginationParams, createPaginatedResponse } from '@/lib/rbac/api-helpers';

const { page, limit } = parsePaginationParams(request);
const total = await prisma.user.count();
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
});

return NextResponse.json(createPaginatedResponse(users, total, page, limit));
```

## Permission System

### Role Types

- `Admin/Manager` - Full organization access
- `Team Leader` - Team-specific access
- `User/Employee` - Limited self and team access

### Permission Actions

- `create` - Create new resources
- `read` - View resources
- `update` - Modify existing resources
- `delete` - Remove resources
- `assign` - Assign roles/teams
- `manage` - Full management access

### Resource Types

- `users` - User management
- `teams` - Team management
- `roles` - Role management
- `tickets` - Ticket system
- `analytics` - Analytics and reports
- `audit_logs` - Audit log access
- `knowledge_base` - Knowledge base articles

### Scope Types

- `own` - User's own resources only
- `team` - Team-scoped resources
- `organization` - Organization-wide access

## Scope Filtering Examples

### User Scope Filtering

```typescript
// Admin/Manager: No filter (sees all users)
// Team Leader: { OR: [{ id: userId }, { teamId: { in: teamIds } }] }
// User/Employee: { id: userId }
```

### Team Scope Filtering

```typescript
// Admin/Manager: No filter (sees all teams)
// Team Leader: { id: { in: teamIds } }
// User/Employee: { id: { in: [userTeamId] } }
```

### Ticket Scope Filtering

```typescript
// Admin/Manager: No filter (sees all tickets)
// Team Leader: { OR: [{ assignedTo: userId }, { assignedUser: { teamId: { in: teamIds } } }] }
// User/Employee: { assignedTo: userId }
```

## Error Handling

The middleware automatically handles and returns appropriate error responses:

- `401 Unauthorized` - No valid session
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `400 Bad Request` - Validation errors
- `500 Internal Server Error` - System errors

## Audit Logging

All protected routes automatically log:

- User ID and role
- Action performed
- Resource type and ID
- Success/failure status
- IP address and user agent
- Timestamp
- Additional details

## Best Practices

1. **Use High-level Helpers**: Prefer `createUserManagementRoute` over manual middleware composition
2. **Validate Input**: Always validate request bodies using `validateRequestBody`
3. **Apply Scope Filters**: Use `scopeFilter` in database queries for proper data isolation
4. **Handle Errors**: Let the middleware handle permission errors automatically
5. **Audit Important Actions**: Don't skip audit logging for sensitive operations
6. **Test Permissions**: Verify that each role can only access appropriate resources

## Example API Route Structure

```
app/api/
├── users/
│   ├── route.ts          # GET (list), POST (create)
│   ├── [id]/
│   │   └── route.ts      # GET, PUT, DELETE specific user
│   └── me/
│       └── route.ts      # GET, PUT own profile
├── teams/
│   ├── route.ts          # GET (list), POST (create)
│   ├── [id]/
│   │   ├── route.ts      # GET, PUT, DELETE specific team
│   │   └── members/
│   │       └── route.ts  # GET team members
└── roles/
    ├── route.ts          # GET (list), POST (create)
    └── [id]/
        └── route.ts      # GET, PUT, DELETE specific role
```

## Testing

Test your protected routes with different user roles:

```typescript
// Test with Admin user
const adminResponse = await fetch('/api/users', {
  headers: { Cookie: `session-token=${adminToken}` }
});

// Test with Team Leader
const teamLeaderResponse = await fetch('/api/users', {
  headers: { Cookie: `session-token=${teamLeaderToken}` }
});

// Test with regular User
const userResponse = await fetch('/api/users', {
  headers: { Cookie: `session-token=${userToken}` }
});
```