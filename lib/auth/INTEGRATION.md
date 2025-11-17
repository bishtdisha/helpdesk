# Integration Guide

This guide shows how to integrate the authentication and authorization infrastructure into your Next.js application.

## Step 1: Wrap Your App with AuthProvider

Update your root layout to include the `AuthProvider`:

```tsx
// app/layout.tsx
import { AuthProvider } from '@/lib/auth';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Step 2: Create a Protected Route

Create a middleware or use the `useAuth` hook to protect routes:

```tsx
// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return <div>Dashboard Content</div>;
}
```

## Step 3: Use Permission Guards in Components

```tsx
// components/ticket-actions.tsx
'use client';

import { PermissionGuard } from '@/lib/auth';

export function TicketActions({ ticket }) {
  return (
    <div className="flex gap-2">
      {/* Show edit button only to users who can edit */}
      <PermissionGuard require="canEditTicket" ticket={ticket}>
        <button>Edit</button>
      </PermissionGuard>

      {/* Show assign button only to Admin_Manager and Team_Leader */}
      <PermissionGuard requireRole={["Admin_Manager", "Team_Leader"]}>
        <button>Assign</button>
      </PermissionGuard>

      {/* Show delete button only to users who can delete */}
      <PermissionGuard require="canDeleteTicket" ticket={ticket}>
        <button>Delete</button>
      </PermissionGuard>
    </div>
  );
}
```

## Step 4: Use Permission Hooks for Logic

```tsx
// components/ticket-list.tsx
'use client';

import { usePermissions } from '@/lib/auth';

export function TicketList({ tickets }) {
  const permissions = usePermissions();

  const handleBulkAction = () => {
    if (!permissions.canAssignTicket()) {
      alert('You do not have permission to perform bulk actions');
      return;
    }
    // Perform bulk action
  };

  return (
    <div>
      {permissions.canCreateTicket() && (
        <button>Create New Ticket</button>
      )}
      
      {permissions.canAssignTicket() && (
        <button onClick={handleBulkAction}>Bulk Assign</button>
      )}
      
      {/* Ticket list */}
    </div>
  );
}
```

## Step 5: Create Login Page

```tsx
// app/login/page.tsx
'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>
        
        {error && (
          <div className="rounded bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded border p-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded border p-2"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
```

## Step 6: Add User Menu with Logout

```tsx
// components/user-menu.tsx
'use client';

import { useAuth } from '@/lib/auth';

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <div>
        <div className="font-medium">{user.name || user.email}</div>
        <div className="text-sm text-gray-500">{user.role?.name}</div>
      </div>
      <button
        onClick={logout}
        className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
      >
        Logout
      </button>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Conditional Navigation

```tsx
import { useAuth, usePermissions } from '@/lib/auth';

export function Navigation() {
  const { isAuthenticated } = useAuth();
  const permissions = usePermissions();

  if (!isAuthenticated) return null;

  return (
    <nav>
      <a href="/tickets">Tickets</a>
      
      {permissions.canViewAnalytics() && (
        <a href="/analytics">Analytics</a>
      )}
      
      {permissions.canManageSLA() && (
        <a href="/sla">SLA Management</a>
      )}
    </nav>
  );
}
```

### Pattern 2: Role-Based Dashboard

```tsx
import { useAuth } from '@/lib/auth';

export function Dashboard() {
  const { role } = useAuth();

  switch (role) {
    case 'Admin_Manager':
      return <AdminDashboard />;
    case 'Team_Leader':
      return <TeamDashboard />;
    case 'User_Employee':
      return <UserDashboard />;
    default:
      return <div>Please contact support for access</div>;
  }
}
```

### Pattern 3: Permission-Based API Calls

```tsx
import { usePermissions } from '@/lib/auth';

export function TicketDetail({ ticket }) {
  const permissions = usePermissions();

  const handleDelete = async () => {
    if (!permissions.canDeleteTicket(ticket)) {
      alert('You do not have permission to delete this ticket');
      return;
    }

    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'DELETE',
      });

      if (response.status === 403) {
        alert('Access denied by server');
      } else if (response.ok) {
        // Success
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div>
      {/* Ticket details */}
      {permissions.canDeleteTicket(ticket) && (
        <button onClick={handleDelete}>Delete</button>
      )}
    </div>
  );
}
```

## Testing

When testing components that use authentication:

```tsx
import { render } from '@testing-library/react';
import { AuthProvider } from '@/lib/auth';

function renderWithAuth(component) {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
}

test('shows admin features for admin users', () => {
  // Mock the API response
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        user: {
          id: '1',
          email: 'admin@example.com',
          role: { name: 'Admin_Manager' }
        }
      })
    })
  );

  const { getByText } = renderWithAuth(<MyComponent />);
  
  // Assert admin features are visible
});
```

## Troubleshooting

### Issue: "useAuth must be used within an AuthProvider"

**Solution:** Make sure your component is wrapped with `AuthProvider` in the component tree.

### Issue: Permission checks always return false

**Solution:** Ensure the user data is loaded. Check `isLoading` before checking permissions.

### Issue: User data not persisting across page refreshes

**Solution:** The auth system uses cookies for session management. Ensure cookies are enabled and the API is setting them correctly.

## Next Steps

1. Implement the API client for ticket operations (Task 3)
2. Create ticket list and detail components (Tasks 4-5)
3. Build ticket creation form (Task 6)
4. Add real-time updates and notifications (Phase 2)
