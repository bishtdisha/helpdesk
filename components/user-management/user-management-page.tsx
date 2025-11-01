"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ActionButton } from "@/components/rbac/action-button"
import { PermissionGate } from "@/components/rbac/permission-gate"
import { PERMISSION_ACTIONS, RESOURCE_TYPES, ROLE_TYPES } from "@/lib/rbac/permissions"
import { Plus, Users, Shield } from "lucide-react"

/**
 * User Management Page component that demonstrates role-based UI controls
 */
export function UserManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions across your organization
          </p>
        </div>
        
        {/* Create User Button - Admin only */}
        <ActionButton
          action={PERMISSION_ACTIONS.CREATE}
          resource={RESOURCE_TYPES.USERS}
          variant="default"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create User
        </ActionButton>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User List Card - Available to Admin and Team Leaders */}
        <PermissionGate
          action={PERMISSION_ACTIONS.READ}
          resource={RESOURCE_TYPES.USERS}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Directory
              </CardTitle>
              <CardDescription>
                View and manage user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access user profiles, update information, and manage account status.
              </p>
            </CardContent>
          </Card>
        </PermissionGate>

        {/* Role Management Card - Admin only */}
        <PermissionGate
          action={PERMISSION_ACTIONS.MANAGE}
          resource={RESOURCE_TYPES.ROLES}
          requireRole={ROLE_TYPES.ADMIN_MANAGER}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Management
              </CardTitle>
              <CardDescription>
                Configure roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Define roles, assign permissions, and manage access control.
              </p>
            </CardContent>
          </Card>
        </PermissionGate>

        {/* Team Assignment Card - Admin and Team Leaders */}
        <PermissionGate
          action={PERMISSION_ACTIONS.READ}
          resource={RESOURCE_TYPES.TEAMS}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Assignment
              </CardTitle>
              <CardDescription>
                Manage team memberships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Assign users to teams and manage team structures.
              </p>
            </CardContent>
          </Card>
        </PermissionGate>
      </div>

      {/* Action Buttons Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common user management tasks based on your permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <ActionButton
              action={PERMISSION_ACTIONS.CREATE}
              resource={RESOURCE_TYPES.USERS}
              variant="outline"
              size="sm"
            >
              Add New User
            </ActionButton>
            
            <ActionButton
              action={PERMISSION_ACTIONS.CREATE}
              resource={RESOURCE_TYPES.TEAMS}
              variant="outline"
              size="sm"
            >
              Create Team
            </ActionButton>
            
            <ActionButton
              action={PERMISSION_ACTIONS.READ}
              resource={RESOURCE_TYPES.AUDIT_LOGS}
              variant="outline"
              size="sm"
            >
              View Audit Logs
            </ActionButton>
            
            <ActionButton
              action={PERMISSION_ACTIONS.ASSIGN}
              resource={RESOURCE_TYPES.ROLES}
              variant="outline"
              size="sm"
            >
              Assign Roles
            </ActionButton>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}