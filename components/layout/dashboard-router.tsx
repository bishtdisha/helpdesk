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
  const { user } = useAuth()

  // Show skeleton while user data loads (non-blocking)
  if (!user) {
    return <DashboardSkeleton />
  }

  // Get user role
  const userRole = user.role?.name

  // Route based on role (Requirement 18.5, 24.1, 24.3)
  switch (userRole) {
    case ROLE_TYPES.USER_EMPLOYEE:
      // User_Employee sees customizable dashboard with widgets
      return (
        <Suspense fallback={<DashboardSkeleton />}>
          <CustomizableDashboard />
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
      // Fallback to customizable dashboard
      return (
        <Suspense fallback={<DashboardSkeleton />}>
          <CustomizableDashboard />
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
