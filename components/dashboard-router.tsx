"use client"

import { useAuth } from "@/lib/hooks/use-auth"
import { ROLE_TYPES } from "@/lib/rbac/permissions"
import { 
  UserDashboardWithSuspense,
  OrganizationDashboardWithSuspense,
  TeamDashboardWithSuspense,
  DashboardSkeleton
} from "@/lib/performance/lazy-components"
import { CustomizableDashboard } from "@/components/dashboard/customizable-dashboard"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Suspense } from "react"

/**
 * DashboardRouter component that routes users to role-specific dashboards
 * Requirements: 18.5, 24.1, 24.3
 * 
 * - Admin/Manager: Organization Dashboard (Analytics)
 * - Team Leader: Team Dashboard (Analytics)
 * - User/Employee: User Dashboard (Personal Stats & Tickets)
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

  // Route based on role (Requirement 18.5, 24.1, 24.3)
  switch (userRole) {
    case ROLE_TYPES.USER_EMPLOYEE:
      // User_Employee sees their personal dashboard
      return (
        <Suspense fallback={<DashboardSkeleton />}>
          <UserDashboardWithSuspense />
        </Suspense>
      )
    case ROLE_TYPES.ADMIN_MANAGER:
      // Admin_Manager sees customizable dashboard with widgets
      return (
        <Suspense fallback={<DashboardSkeleton />}>
          <CustomizableDashboard />
        </Suspense>
      )
    case ROLE_TYPES.TEAM_LEADER:
      // Team_Leader sees customizable dashboard (same as admin for now)
      return (
        <Suspense fallback={<DashboardSkeleton />}>
          <CustomizableDashboard />
        </Suspense>
      )
    default:
      // Fallback to user dashboard
      return (
        <Suspense fallback={<DashboardSkeleton />}>
          <UserDashboardWithSuspense />
        </Suspense>
      )
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
