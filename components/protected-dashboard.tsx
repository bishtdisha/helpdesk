"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { Tickets } from "@/components/tickets"
import { Customers } from "@/components/customers"
import { Reports } from "@/components/reports"
import { KnowledgeBase } from "@/components/knowledge-base"
import { Settings } from "@/components/settings"
import { NavigationHeader } from "@/components/navigation-header"
import { UserManagementPage } from "@/components/user-management/user-management-page"
// import { AuditLogs } from "@/components/audit-logs"
// import { AuditMonitoring } from "@/components/audit-monitoring"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User } from "lucide-react"
import { UserRoleBadge } from "@/components/rbac/user-role-badge"
import { PermissionGate } from "@/components/rbac/permission-gate"
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from "@/lib/rbac/permissions"
import type { SafeUser } from "@/lib/types/auth"

interface ProtectedDashboardProps {
  user: SafeUser
}

export function ProtectedDashboard({ user }: ProtectedDashboardProps) {
  const [activeModule, setActiveModule] = useState("dashboard")

  const renderActiveModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard />
      case "tickets":
        return <Tickets />
      case "users":
        return <UserManagementPage />
      case "teams":
        return <Customers />
      case "reports":
        return <Reports />
      case "knowledge-base":
        return <KnowledgeBase />
      case "settings":
        return <Settings />
      case "audit-logs":
        return (
          <PermissionGate
            action={PERMISSION_ACTIONS.READ}
            resource={RESOURCE_TYPES.AUDIT_LOGS}
            fallback={
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    You don't have permission to view audit logs.
                  </p>
                </CardContent>
              </Card>
            }
          >
            <div className="space-y-6">
              <h1 className="text-3xl font-bold tracking-tight">Security & Audit</h1>
              <Card>
                <CardHeader>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>
                    Audit logging functionality will be available here once fully implemented.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This feature is currently under development. The audit logging system is functional 
                    in the backend, but the UI components are being finalized.
                  </p>
                </CardContent>
              </Card>
            </div>
          </PermissionGate>
        )
      default:
        return <Dashboard />
    }
  }

  const getModuleTitle = (module: string) => {
    switch (module) {
      case "dashboard":
        return "Dashboard"
      case "tickets":
        return "Tickets"
      case "users":
        return "User Management"
      case "teams":
        return "Teams"
      case "reports":
        return "Reports"
      case "knowledge-base":
        return "Knowledge Base"
      case "settings":
        return "Settings"
      case "audit-logs":
        return "Security & Audit"
      default:
        return "Dashboard"
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <NavigationHeader title={getModuleTitle(activeModule)} />
        
        <main className="flex-1 overflow-auto p-6">
          {/* Show user welcome message and placeholder content when on dashboard */}
          {activeModule === "dashboard" && (
            <div className="space-y-6">
              {/* Welcome Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Welcome back, {user.name || 'User'}!
                  </CardTitle>
                  <CardDescription>
                    You're logged in as {user.email}. Here's your dashboard overview.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Account Information</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p><strong>Name:</strong> {user.name || 'Not set'}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <div className="flex items-center gap-2">
                          <strong>Role:</strong> 
                          <UserRoleBadge roleId={user.roleId} />
                        </div>
                        <p><strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}</p>
                        <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Quick Actions</h4>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setActiveModule("tickets")}
                          className="w-full justify-start"
                        >
                          View Tickets
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setActiveModule("knowledge-base")}
                          className="w-full justify-start"
                        >
                          Browse Knowledge Base
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setActiveModule("settings")}
                          className="w-full justify-start"
                        >
                          Account Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Placeholder Content for Future Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">My Tickets</CardTitle>
                    <CardDescription>Your recent support tickets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Ticket management features will be available here once implemented.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Team Activity</CardTitle>
                    <CardDescription>Recent team updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Team collaboration features will be available here once implemented.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Knowledge Base</CardTitle>
                    <CardDescription>Helpful articles and guides</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Knowledge base articles will be available here once implemented.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Render other modules */}
          {activeModule !== "dashboard" && renderActiveModule()}
        </main>
      </div>
    </div>
  )
}