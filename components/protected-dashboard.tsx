"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { Tickets } from "@/components/tickets"
import { Customers } from "@/components/customers"
import { Reports } from "@/components/reports"
import { KnowledgeBase } from "@/components/knowledge-base"

import { NavigationHeader } from "@/components/navigation-header"
import { UserManagementPage } from "@/components/user-management/user-management-page"
import { TeamManagement } from "@/components/team-management/team-management"
import { SLAManagement } from "@/components/sla-management"

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
        return <TeamManagement />
      case "reports":
        return <Reports />
      case "knowledge-base":
        return <KnowledgeBase />

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
              {/* Welcome Card with Role Context */}
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/20 to-transparent dark:via-slate-700/20"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    <div className="p-2 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 shadow-sm">
                      <User className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                    </div>
                    Welcome back, {user.name || 'User'}!
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground mt-2">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span>Role: <strong>{user.role?.name || 'No role assigned'}</strong></span>
                      </div>
                      {user.team && (
                        <div className="flex items-center gap-2">
                          <span>Team: <strong>{user.team.name}</strong></span>
                        </div>
                      )}
                      {user.teamLeaderships && user.teamLeaderships.length > 0 && (
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <span>👑 Leading: <strong>{user.teamLeaderships.map((tl: any) => tl.team.name).join(', ')}</strong></span>
                        </div>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
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