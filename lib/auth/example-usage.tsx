'use client';

/**
 * Example component demonstrating the usage of authentication and authorization infrastructure
 * This file is for reference only and should not be imported in production code
 */

import { useAuth } from '@/lib/contexts';
import { usePermissions } from '@/lib/hooks';
import { PermissionGuard } from '@/lib/components';

// Example 1: Basic authentication check
export function BasicAuthExample() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to continue</div>;
  }

  return (
    <div>
      <h2>Welcome, {user?.name || user?.email}!</h2>
      <p>Role: {user?.role?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Example 2: Role-based rendering
export function RoleBasedExample() {
  const { role } = useAuth();

  return (
    <div>
      <h2>Dashboard</h2>
      
      {role === 'Admin_Manager' && (
        <div>
          <h3>Admin Dashboard</h3>
          <p>You have full access to all features</p>
        </div>
      )}
      
      {role === 'Team_Leader' && (
        <div>
          <h3>Team Dashboard</h3>
          <p>You can manage your team's tickets</p>
        </div>
      )}
      
      {role === 'User_Employee' && (
        <div>
          <h3>My Tickets</h3>
          <p>View and manage your tickets</p>
        </div>
      )}
    </div>
  );
}

// Example 3: Permission-based actions
export function PermissionBasedActionsExample({ ticket }: { ticket: any }) {
  const permissions = usePermissions();

  return (
    <div>
      <h3>Ticket Actions</h3>
      <div style={{ display: 'flex', gap: '8px' }}>
        {permissions.canEditTicket(ticket) && (
          <button>Edit</button>
        )}
        
        {permissions.canAssignTicket(ticket) && (
          <button>Assign</button>
        )}
        
        {permissions.canDeleteTicket(ticket) && (
          <button>Delete</button>
        )}
        
        {permissions.canAddInternalNotes() && (
          <button>Add Internal Note</button>
        )}
      </div>
    </div>
  );
}

// Example 4: Using PermissionGuard component
export function PermissionGuardExample() {
  return (
    <div>
      <h2>Feature Access</h2>
      
      {/* Single permission check */}
      <PermissionGuard require="canViewAnalytics">
        <div>
          <h3>Analytics Dashboard</h3>
          <p>View your analytics here</p>
        </div>
      </PermissionGuard>
      
      {/* Role-based check */}
      <PermissionGuard requireRole="Admin_Manager">
        <div>
          <h3>Admin Panel</h3>
          <p>Manage system settings</p>
        </div>
      </PermissionGuard>
      
      {/* Multiple roles (OR logic) */}
      <PermissionGuard requireRole={["Admin_Manager", "Team_Leader"]}>
        <div>
          <h3>Team Management</h3>
          <p>Manage team members and assignments</p>
        </div>
      </PermissionGuard>
      
      {/* With fallback */}
      <PermissionGuard 
        require="canManageSLA"
        fallback={<div>You don't have access to SLA management</div>}
      >
        <div>
          <h3>SLA Management</h3>
          <p>Configure SLA policies</p>
        </div>
      </PermissionGuard>
    </div>
  );
}

// Example 5: Complex permission logic
export function ComplexPermissionExample({ ticket }: { ticket: any }) {
  const { user, role } = useAuth();
  const permissions = usePermissions();

  // Complex business logic combining multiple permission checks
  const canPerformBulkActions = 
    permissions.canAssignTicket() && 
    permissions.canEditTicket() &&
    (role === 'Admin_Manager' || role === 'Team_Leader');

  const isTicketOwner = ticket.createdById === user?.id;
  const isTicketAssignee = ticket.assignedToId === user?.id;
  const canViewTicket = 
    permissions.canViewAllTickets() || 
    permissions.canViewTeamTickets() || 
    isTicketOwner || 
    isTicketAssignee;

  if (!canViewTicket) {
    return <div>You don't have permission to view this ticket</div>;
  }

  return (
    <div>
      <h3>Ticket #{ticket.id}</h3>
      
      {canPerformBulkActions && (
        <button>Bulk Actions</button>
      )}
      
      {(isTicketOwner || permissions.canEditTicket(ticket)) && (
        <button>Edit Ticket</button>
      )}
      
      <PermissionGuard 
        require={["canAssignTicket", "canEditTicket"]}
        ticket={ticket}
      >
        <button>Reassign Ticket</button>
      </PermissionGuard>
    </div>
  );
}

// Example 6: Login form
export function LoginFormExample() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

// Example 7: Protected page layout
export function ProtectedPageExample() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const permissions = usePermissions();

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>Please log in to access this page</p>
        <a href="/login">Go to Login</a>
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1>Ticket System</h1>
        <div>
          <span>{user?.name || user?.email}</span>
          <span> ({user?.role?.name})</span>
        </div>
      </header>
      
      <nav>
        <a href="/tickets">Tickets</a>
        
        {permissions.canViewAnalytics() && (
          <a href="/analytics">Analytics</a>
        )}
        
        {permissions.canManageSLA() && (
          <a href="/sla">SLA Management</a>
        )}
        
        {permissions.canManageUsers() && (
          <a href="/users">User Management</a>
        )}
      </nav>
      
      <main>
        {/* Page content */}
      </main>
    </div>
  );
}

// Import React for the LoginFormExample
import React from 'react';
