// RBAC middleware for API routes and server actions
import { type NextRequest, NextResponse } from "next/server"
import { getUserById, hasFullAccess, type UserRole } from "./auth"

export interface RBACContext {
  user: {
    id: string
    organizationId: string
    role: UserRole
  }
}

export function withAuth(handler: (req: NextRequest, context: RBACContext) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      // Get user ID from session/token (simplified for demo)
      const userId = req.headers.get("x-user-id")

      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const user = await getUserById(userId)

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 })
      }

      const context: RBACContext = {
        user: {
          id: user.id,
          organizationId: user.organizationId,
          role: user.role,
        },
      }

      return handler(req, context)
    } catch (error) {
      console.error("Auth middleware error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (handler: (req: NextRequest, context: RBACContext) => Promise<NextResponse>) =>
    withAuth(async (req: NextRequest, context: RBACContext) => {
      if (!allowedRoles.includes(context.user.role)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }

      return handler(req, context)
    })
}

export function requireFullAccess() {
  return requireRole(["admin", "manager"])
}

export function requireTeamManagement() {
  return requireRole(["admin", "manager", "team_leader"])
}

export async function filterByUserAccess<
  T extends { id: string; assigned_to_user_id?: string; assigned_to_team_id?: string },
>(items: T[], userId: string, userRole: UserRole, userTeams: string[]): Promise<T[]> {
  if (hasFullAccess(userRole)) {
    return items
  }

  return items.filter((item) => {
    // User can see items assigned to them
    if (item.assigned_to_user_id === userId) {
      return true
    }

    // User can see items assigned to their teams
    if (item.assigned_to_team_id && userTeams.includes(item.assigned_to_team_id)) {
      return true
    }

    return false
  })
}

export function buildOrganizationFilter(organizationId: string) {
  return `organization_id = '${organizationId}'`
}

export function buildUserAccessFilter(userId: string, userRole: UserRole, userTeams: string[]) {
  if (hasFullAccess(userRole)) {
    return "" // No additional filtering needed
  }

  const teamFilter =
    userTeams.length > 0 ? `assigned_to_team_id IN (${userTeams.map((id) => `'${id}'`).join(", ")})` : "FALSE"

  return `(assigned_to_user_id = '${userId}' OR ${teamFilter})`
}
