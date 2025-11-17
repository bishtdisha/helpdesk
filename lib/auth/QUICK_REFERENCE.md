# Quick Reference Card

## Import Statements

```tsx
// All-in-one import
import { AuthProvider, useAuth, usePermissions, PermissionGuard } from '@/lib/auth';

// Or individual imports
import { AuthProvider, useAuth } from '@/lib/contexts';
import { usePermissions } from '@/lib/hooks';
import { PermissionGuard } from '@/lib/components';
```

## Setup (One Time)

```tsx
// app/layout.tsx
import { AuthProvider } from '@/lib/auth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

## useAuth Hook

```tsx
const {
  user,              // User object with role and team
  role,              // 'Admin_Manager' | 'Team_Leader' | 'User_Employee'
  isLoading,         // true while fetching user data
  isAuthenticated,   // true if user is logged in
  login,             // (email, password) => Promise<{success, error?}>
  logout,            // () => Promise<void>
  refreshUser,       // () => Promise<void>
} = useAuth();
```

## usePermissions Hook

```tsx
const {
  canAssignTicket,              // (ticket?) => boolean
  canViewAnalytics,             // () => boolean
  canManageSLA,                 // () => boolean
  canCreateTicket,              // () => boolean
  canEditTicket,                // (ticket?) => boolean
  canDeleteTicket,              // (ticket?) => boolean
  canViewOrganizationAnalytics, // () => boolean
  canViewTeamAnalytics,         // () => boolean
  canManageEscalation,          // () => boolean
  canManageUsers,               // () => boolean
  canManageTeams,               // () => boolean
  canViewAllTickets,            // () => boolean
  canViewTeamTickets,           // () => boolean
  canAddInternalNotes,          // () => boolean
  hasRole,                      // (role) => boolean
} = usePermissions();
```

## PermissionGuard Component

```tsx
// Single permission
<PermissionGuard require="canManageSLA">
  <SLAButton />
</PermissionGuard>

// Multiple permissions (AND)
<PermissionGuard require={["canEditTicket", "canAssignTicket"]}>
  <EditForm />
</PermissionGuard>

// Single role
<PermissionGuard requireRole="Admin_Manager">
  <AdminPanel />
</PermissionGuard>

// Multiple roles (OR)
<PermissionGuard requireRole={["Admin_Manager", "Team_Leader"]}>
  <TeamPanel />
</PermissionGuard>

// With fallback
<PermissionGuard require="canViewAnalytics" fallback={<AccessDenied />}>
  <Analytics />
</PermissionGuard>

// With ticket context
<PermissionGuard require="canEditTicket" ticket={ticket}>
  <EditButton />
</PermissionGuard>
```

## Common Patterns

### Protected Page
```tsx
const { isAuthenticated, isLoading } = useAuth();

if (isLoading) return <Loading />;
if (!isAuthenticated) return <Redirect to="/login" />;

return <PageContent />;
```

### Conditional Rendering
```tsx
const permissions = usePermissions();

return (
  <div>
    {permissions.canCreateTicket() && <CreateButton />}
    {permissions.canViewAnalytics() && <AnalyticsLink />}
  </div>
);
```

### Role-Based Content
```tsx
const { role } = useAuth();

return (
  <div>
    {role === 'Admin_Manager' && <AdminDashboard />}
    {role === 'Team_Leader' && <TeamDashboard />}
    {role === 'User_Employee' && <UserDashboard />}
  </div>
);
```

### Login Form
```tsx
const { login } = useAuth();
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

const handleSubmit = async (e) => {
  e.preventDefault();
  const result = await login(email, password);
  if (result.success) {
    router.push('/dashboard');
  } else {
    alert(result.error);
  }
};
```

### Permission Check Before Action
```tsx
const permissions = usePermissions();

const handleDelete = () => {
  if (!permissions.canDeleteTicket(ticket)) {
    alert('No permission');
    return;
  }
  // Proceed with delete
};
```

## Role Permissions Matrix

| Feature | Admin_Manager | Team_Leader | User_Employee |
|---------|--------------|-------------|---------------|
| View All Tickets | ✅ | ❌ | ❌ |
| View Team Tickets | ✅ | ✅ | ❌ |
| View Own Tickets | ✅ | ✅ | ✅ |
| Create Tickets | ✅ | ✅ | ✅ |
| Edit Any Ticket | ✅ | ❌ | ❌ |
| Edit Team Tickets | ✅ | ✅ | ❌ |
| Edit Own Tickets | ✅ | ✅ | ✅ |
| Assign Tickets | ✅ | ✅ (team only) | ❌ |
| Delete Tickets | ✅ | ✅ (team only) | ❌ |
| View Analytics | ✅ | ✅ (team only) | ❌ |
| Manage SLA | ✅ | ❌ | ❌ |
| Manage Escalation | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| Manage Teams | ✅ | ❌ | ❌ |
| Add Internal Notes | ✅ | ✅ | ❌ |

## API Endpoints

- `GET /api/auth/me` - Get current user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

## TypeScript Types

```tsx
type UserRole = 'Admin_Manager' | 'Team_Leader' | 'User_Employee';

interface User {
  id: string;
  email: string;
  name: string | null;
  roleId: string | null;
  teamId: string | null;
  isActive: boolean;
  role?: { id: string; name: string; } | null;
  team?: { id: string; name: string; } | null;
}
```

## Tips

1. Always check `isLoading` before checking `isAuthenticated`
2. Use `PermissionGuard` for UI elements, `usePermissions` for logic
3. Pass ticket context to permission functions when checking ticket-specific permissions
4. Frontend permissions are for UX only - backend enforces security
5. Use `refreshUser()` after operations that might change user data
