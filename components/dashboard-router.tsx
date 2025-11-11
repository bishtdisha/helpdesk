"use client"

import { useAuth } from "@/lib/hooks/use-auth"
import { ROLE_TYPES } from "@/lib/rbac/permissions"
import { Dashboard } from "@/components/dashboard"
import { AnalyticsPage } from "@/components/analytics/analytics-page"
import { Tickets } from "@/components/tickets"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

/**
 * DashboardRouter component that routes users to role-specific dashboards
 * Requirements: 18.5
 * 
 * - Admin/Manager: Organization Dashboard (Analytics)
 * - Team Leader: Team Dashboard (Analytics)
 * - User/Employee: Ticket List (Own Tickets)
 */
export function DashboardRouter() {
  const { user, isAuthenticated, isLoading } = useAuth()

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please log in to view your dashboard.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Get user role
  const userRole = user.role?.name

  // Route based on role (Requirement 18.5)
  switch (userRole) {
    case ROLE_TYPES.ADMIN_MANAGER:
      // Admin users see organization-wide analytics dashboard
      return <AnalyticsPage />

    case ROLE_TYPES.TEAM_LEADER:
      // Team Leaders see team-specific analytics dashboard
      return <AnalyticsPage />

    case ROLE_TYPES.USER_EMPLOYEE:
      // User/Employee sees their own tickets
      return <Tickets />

    default:
      // Fallback to generic dashboard for unknown roles
      return <Dashboard />
  }
}

/**
 * Hook to get the default dashboard route for a user's role
 */
export function useDefaultDashboardRoute() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return '/login'
  }

  const userRole = user.role?.name

  switch (userRole) {
    case ROLE_TYPES.ADMIN_MANAGER:
      return '/dashboard' // Organization analytics
    case ROLE_TYPES.TEAM_LEADER:
      return '/dashboard' // Team analytics
    case ROLE_TYPES.USER_EMPLOYEE:
      return '/dashboard' // Own tickets
    default:
      return '/dashboard'
  }
}
