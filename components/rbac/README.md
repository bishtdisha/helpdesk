# RBAC Components

This directory contains Role-Based Access Control (RBAC) components for the ticket management system.

## Components

### PermissionGate

A simple component that conditionally renders children based on user permissions. Returns `null` or a custom fallback when permission is denied.

**Usage:**
```tsx
import { PermissionGate } from '@/components/rbac/permission-gate';
import { PERMISSION_ACTIONS, RESOURCE_TYPES, ROLE_TYPES } from '@/lib/rbac/permissions';

// Hide component if user doesn't have permission
<PermissionGate action={PERMISSION_ACTIONS.CREATE} resource={RESOURCE_TYPES.TICKETS}>
  <CreateTicketButton />
</PermissionGate>

// Require specific role
<PermissionGate requireRole={ROLE_TYPES.ADMIN_MANAGER}>
  <AdminPanel />
</PermissionGate>

// Exclude specific roles
<PermissionGate excludeRoles={[ROLE_TYPES.USER_EMPLOYEE]}>
  <AnalyticsLink />
</PermissionGate>
```

### PermissionGuard

An enhanced version of PermissionGate that shows user-friendly error messages when access is denied.

**Usage:**
```tsx
import { PermissionGuard } from '@/components/rbac/permission-guard';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '@/lib/rbac/permissions';

// Show error message when permission denied
<PermissionGuard 
  action={PERMISSION_ACTIONS.UPDATE} 
  resource={RESOURCE_TYPES.USERS}
  showFallback={true}
>
  <UserEditForm />
</PermissionGuard>

// Custom fallback message
<PermissionGuard 
  requireRole={ROLE_TYPES.ADMIN_MANAGER}
  showFallback={true}
  fallback={<div>Only administrators can access this feature.</div>}
>
  <SystemSettings />
</PermissionGuard>
```

### Hooks

#### usePermission

Check permissions programmatically in your components.

```tsx
import { usePermission } from '@/components/rbac/permission-guard';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '@/lib/rbac/permissions';

function MyComponent() {
  const { hasPermission, userRole } = usePermission(
    PERMISSION_ACTIONS.DELETE,
    RESOURCE_TYPES.TICKETS
  );

  if (!hasPermission) {
    return <div>You cannot delete tickets</div>;
  }

  return <DeleteButton />;
}
```

#### useTicketPermission

Get ticket-specific permissions for the current user.

```tsx
import { useTicketPermission } from '@/components/rbac/permission-guard';

function TicketActions() {
  const {
    userRole,
    canCreateTicket,
    canViewAnalytics,
    canManageSLA,
    canExportReports
  } = useTicketPermission();

  return (
    <div>
      {canCreateTicket && <CreateTicketButton />}
      {canViewAnalytics && <AnalyticsLink />}
      {canManageSLA && <SLASettings />}
      {canExportReports && <ExportButton />}
    </div>
  );
}
```

### RoleBasedNavigation

Navigation component that automatically shows/hides menu items based on user role and permissions.

**Features:**
- Automatically filters menu items based on user role
- Hides admin features from Team Leaders and Users
- Hides team management from Users
- Shows analytics only for Admin and Team Leader
- Shows ticket creation for all roles

**Requirements Implemented:**
- 18.1: Role-appropriate menu items
- 18.2: Hide admin features from non-admins
- 18.3: Hide team management from Users

### DashboardRouter

Routes users to role-specific dashboards on login.

**Routing Logic:**
- **Admin/Manager**: Organization-wide analytics dashboard
- **Team Leader**: Team-specific analytics dashboard
- **User/Employee**: Own tickets list

**Requirements Implemented:**
- 18.5: Role-specific dashboard routing

## Permission Matrix

### Admin/Manager
- Full access to all features
- Organization-wide analytics
- User and team management
- SLA and escalation management

### Team Leader
- Team-scoped ticket access
- Team analytics
- Team member management
- Cannot access other teams' data

### User/Employee
- Own tickets and followed tickets
- Cannot view analytics
- Cannot manage users or teams
- Read-only knowledge base access

## Examples

### Protecting a Page Component

```tsx
import { PermissionGuard } from '@/components/rbac/permission-guard';
import { ROLE_TYPES } from '@/lib/rbac/permissions';

export default function AdminPage() {
  return (
    <PermissionGuard requireRole={ROLE_TYPES.ADMIN_MANAGER} showFallback={true}>
      <div>
        <h1>Admin Dashboard</h1>
        {/* Admin-only content */}
      </div>
    </PermissionGuard>
  );
}
```

### Conditional Rendering in Components

```tsx
import { PermissionGate } from '@/components/rbac/permission-gate';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '@/lib/rbac/permissions';

export function TicketActions({ ticketId }: { ticketId: string }) {
  return (
    <div className="flex gap-2">
      {/* Everyone can view */}
      <ViewButton ticketId={ticketId} />
      
      {/* Only users with update permission */}
      <PermissionGate action={PERMISSION_ACTIONS.UPDATE} resource={RESOURCE_TYPES.TICKETS}>
        <EditButton ticketId={ticketId} />
      </PermissionGate>
      
      {/* Only admins can delete */}
      <PermissionGate requireRole={ROLE_TYPES.ADMIN_MANAGER}>
        <DeleteButton ticketId={ticketId} />
      </PermissionGate>
    </div>
  );
}
```

### Using Hooks for Complex Logic

```tsx
import { usePermission, useTicketPermission } from '@/components/rbac/permission-guard';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '@/lib/rbac/permissions';

export function TicketList() {
  const { hasPermission: canCreate } = usePermission(
    PERMISSION_ACTIONS.CREATE,
    RESOURCE_TYPES.TICKETS
  );
  
  const { canViewAnalytics, userRole } = useTicketPermission();

  return (
    <div>
      <div className="flex justify-between">
        <h1>Tickets</h1>
        {canCreate && <CreateTicketButton />}
      </div>
      
      {canViewAnalytics && (
        <div className="mt-4">
          <AnalyticsSummary />
        </div>
      )}
      
      <TicketTable userRole={userRole} />
    </div>
  );
}
```
