# Authentication and Authorization Infrastructure

This directory contains the authentication and authorization infrastructure for the ticket system frontend.

## Components

### AuthProvider & useAuth

The `AuthProvider` component provides global authentication state to the application.

**Setup:**

```tsx
// app/layout.tsx
import { AuthProvider } from '@/lib/contexts';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Usage:**

```tsx
import { useAuth } from '@/lib/contexts';

function MyComponent() {
  const { user, role, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <p>Role: {role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### usePermissions Hook

The `usePermissions` hook provides role-based permission checking functions.

**Usage:**

```tsx
import { usePermissions } from '@/lib/hooks';

function TicketActions({ ticket }) {
  const permissions = usePermissions();

  return (
    <div>
      {permissions.canEditTicket(ticket) && (
        <button>Edit Ticket</button>
      )}
      {permissions.canAssignTicket(ticket) && (
        <button>Assign Ticket</button>
      )}
      {permissions.canDeleteTicket(ticket) && (
        <button>Delete Ticket</button>
      )}
    </div>
  );
}
```

**Available Permission Functions:**

- `canAssignTicket(ticket?)` - Check if user can assign tickets
- `canViewAnalytics()` - Check if user can view analytics
- `canManageSLA()` - Check if user can manage SLA policies
- `canCreateTicket()` - Check if user can create tickets
- `canEditTicket(ticket?)` - Check if user can edit tickets
- `canDeleteTicket(ticket?)` - Check if user can delete tickets
- `canViewOrganizationAnalytics()` - Check if user can view organization analytics
- `canViewTeamAnalytics()` - Check if user can view team analytics
- `canManageEscalation()` - Check if user can manage escalation rules
- `canManageUsers()` - Check if user can manage users
- `canManageTeams()` - Check if user can manage teams
- `canViewAllTickets()` - Check if user can view all tickets
- `canViewTeamTickets()` - Check if user can view team tickets
- `canAddInternalNotes()` - Check if user can add internal notes
- `hasRole(role)` - Check if user has a specific role

### PermissionGuard Component

The `PermissionGuard` component conditionally renders children based on user permissions.

**Usage Examples:**

```tsx
import { PermissionGuard } from '@/lib/components';

// Require single permission
<PermissionGuard require="canManageSLA">
  <SLAManagementButton />
</PermissionGuard>

// Require multiple permissions (AND logic)
<PermissionGuard require={["canEditTicket", "canAssignTicket"]}>
  <TicketEditForm />
</PermissionGuard>

// Require specific role
<PermissionGuard requireRole="Admin_Manager">
  <AdminPanel />
</PermissionGuard>

// Require one of multiple roles (OR logic)
<PermissionGuard requireRole={["Admin_Manager", "Team_Leader"]}>
  <TeamManagement />
</PermissionGuard>

// With fallback content
<PermissionGuard 
  require="canViewAnalytics" 
  fallback={<div>Access Denied</div>}
>
  <AnalyticsDashboard />
</PermissionGuard>

// With ticket context for permission check
<PermissionGuard require="canEditTicket" ticket={ticket}>
  <EditButton />
</PermissionGuard>
```

**Higher-Order Component:**

```tsx
import { withPermission } from '@/lib/components';

const ProtectedComponent = withPermission(MyComponent, {
  require: "canManageSLA",
  fallback: <AccessDenied />
});
```

## Role-Based Access Control (RBAC)

The system supports three user roles:

### Admin_Manager
- Full access to all features
- Can view organization-wide analytics
- Can manage SLA policies and escalation rules
- Can assign tickets to anyone
- Can manage users and teams
- Can view and edit all tickets

### Team_Leader
- Can view team-specific analytics
- Can assign tickets within their team
- Can view and edit team tickets
- Can add internal notes
- Cannot access organization-wide features

### User_Employee
- Can create tickets
- Can view and edit their own tickets
- Can view tickets they're following
- Cannot assign tickets
- Cannot view analytics
- Cannot add internal notes

## API Integration

The authentication system integrates with the following API endpoints:

- `GET /api/auth/me` - Get current user information
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

## Best Practices

1. **Always wrap your app with AuthProvider** at the root level
2. **Use PermissionGuard for UI elements** that should only be visible to certain roles
3. **Use usePermissions for conditional logic** in your components
4. **Pass ticket context** to permission functions when checking ticket-specific permissions
5. **Handle loading states** when using useAuth to avoid flickering
6. **Trust backend RBAC** - Frontend permissions are for UX only, backend enforces security

## Example: Complete Protected Page

```tsx
'use client';

import { useAuth } from '@/lib/contexts';
import { usePermissions } from '@/lib/hooks';
import { PermissionGuard } from '@/lib/components';

export default function TicketsPage() {
  const { user, isLoading } = useAuth();
  const permissions = usePermissions();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Tickets</h1>
      
      {/* Show create button to all authenticated users */}
      {permissions.canCreateTicket() && (
        <button>Create Ticket</button>
      )}
      
      {/* Show analytics only to Admin_Manager and Team_Leader */}
      <PermissionGuard requireRole={["Admin_Manager", "Team_Leader"]}>
        <AnalyticsWidget />
      </PermissionGuard>
      
      {/* Show SLA management only to Admin_Manager */}
      <PermissionGuard requireRole="Admin_Manager">
        <SLAManagement />
      </PermissionGuard>
      
      <TicketList />
    </div>
  );
}
```
