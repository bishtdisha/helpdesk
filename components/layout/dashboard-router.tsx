"use client"

import { useAuth } from "@/lib/hooks/use-auth"
import { ROLE_TYPES } from "@/lib/rbac/permissions"
import { DashboardSkeleton } from "@/lib/performance/lazy-components"
import { OptimizedDashboard } from "@/components/dashboard/optimized-dashboard"

/**
 * DashboardRouter component that routes users to role-specific dashboards
 * Requirements: 18.5, 24.1, 24.3
 * 
 * Performance optimized: Uses OptimizedDashboard which fetches all data
 * in a single batch API call instead of multiple individual requests.
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

  // All roles now use the optimized dashboard for better performance
  // The OptimizedDashboard component handles role-based data filtering
  // via the /api/dashboard/all endpoint
  return <OptimizedDashboard />
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
