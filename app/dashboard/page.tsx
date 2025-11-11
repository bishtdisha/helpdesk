"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { DashboardRouter } from "@/components/dashboard-router"
import { Tickets } from "@/components/tickets"
import { Customers } from "@/components/customers"
import { Reports } from "@/components/reports"
import { KnowledgeBase } from "@/components/knowledge-base"
import { Settings } from "@/components/settings"
import { NavigationHeader } from "@/components/navigation-header"
import { AnalyticsPage } from "@/components/analytics/analytics-page"
import { useAuth } from "@/lib/hooks/use-auth"
import { Loader2 } from "lucide-react"
import { UserManagementPage } from "@/components/user-management/user-management-page"
import { TeamManagement } from "@/components/team-management"

export default function DashboardPage() {
  const [activeModule, setActiveModule] = useState("dashboard")
  const { isAuthenticated, isLoading } = useAuth()

  const getModuleTitle = (module: string) => {
    switch (module) {
      case "dashboard":
        return "Dashboard"
      case "tickets":
        return "Tickets"
      case "teams":
        return "Team Management"
      case "users":
        return "User Management"
      case "analytics":
        return "Analytics"
      case "reports":
        return "Reports"
      case "knowledge-base":
        return "Knowledge Base"
      case "settings":
        return "Settings"
      default:
        return "Dashboard"
    }
  }

  const renderActiveModule = () => {
    switch (activeModule) {
      case "dashboard":
        // Use role-specific dashboard router (Requirement 18.5)
        return <DashboardRouter />
      case "tickets":
        return <Tickets />
      case "users":
        return <UserManagementPage />
      case "teams":
        return <TeamManagement />
      case "analytics":
        return <AnalyticsPage />
      case "reports":
        return <Reports />
      case "knowledge-base":
        return <KnowledgeBase />
      case "settings":
        return <Settings />
      default:
        return <DashboardRouter />
    }
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, middleware will redirect to login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Show the full dashboard interface to authenticated users
  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <NavigationHeader title={getModuleTitle(activeModule)} />
        <main className="flex-1 overflow-auto p-6">{renderActiveModule()}</main>
      </div>
    </div>
  )
}