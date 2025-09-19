import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { getUserById, hasFullAccess, getUserTeams } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd get the user ID from the session/JWT token
    // For demo purposes, we'll use a hardcoded user ID
    const userId = "550e8400-e29b-41d4-a716-446655440004" // Alice Smith (regular user)

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    let ticketStatsQuery = ""
    let customerStatsQuery = ""

    if (hasFullAccess(user.role)) {
      // Admin/Manager can see all tickets in their organization
      ticketStatsQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'new') as new,
          COUNT(*) FILTER (WHERE status = 'open') as open,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
          COUNT(*) FILTER (WHERE status = 'closed') as closed
        FROM tickets 
        WHERE organization_id = $1
      `

      customerStatsQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month
        FROM customers 
        WHERE organization_id = $1
      `
    } else {
      // Team leaders and regular users see only tickets they have access to
      const userTeams = await getUserTeams(userId)
      const teamIds = userTeams.length > 0 ? userTeams : ["00000000-0000-0000-0000-000000000000"]

      ticketStatsQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'new') as new,
          COUNT(*) FILTER (WHERE status = 'open') as open,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
          COUNT(*) FILTER (WHERE status = 'closed') as closed
        FROM tickets 
        WHERE organization_id = $1 
        AND (assigned_to_user_id = $2 OR assigned_to_team_id = ANY($3))
      `

      customerStatsQuery = `
        SELECT 
          COUNT(DISTINCT c.*) as total,
          COUNT(DISTINCT c.*) FILTER (WHERE c.is_active = true) as active,
          COUNT(DISTINCT c.*) FILTER (WHERE c.created_at >= NOW() - INTERVAL '30 days') as new_this_month
        FROM customers c
        JOIN tickets t ON c.id = t.customer_id
        WHERE c.organization_id = $1 
        AND (t.assigned_to_user_id = $2 OR t.assigned_to_team_id = ANY($3))
      `
    }

    // Execute queries
    const ticketStatsParams = hasFullAccess(user.role)
      ? [user.organizationId]
      : [user.organizationId, userId, await getUserTeams(userId)]

    const customerStatsParams = hasFullAccess(user.role)
      ? [user.organizationId]
      : [user.organizationId, userId, await getUserTeams(userId)]

    const [ticketStats, customerStats] = await Promise.all([
      sql.unsafe(ticketStatsQuery, ticketStatsParams),
      sql.unsafe(customerStatsQuery, customerStatsParams),
    ])

    let recentActivityQuery = ""
    if (hasFullAccess(user.role)) {
      recentActivityQuery = `
        SELECT 
          t.id,
          t.subject,
          t.status,
          t.priority,
          t.created_at,
          t.updated_at,
          c.first_name || ' ' || c.last_name as customer_name,
          u.first_name || ' ' || u.last_name as assigned_user_name
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN users u ON t.assigned_to_user_id = u.id
        WHERE t.organization_id = $1
        ORDER BY t.updated_at DESC
        LIMIT 10
      `
    } else {
      const userTeams = await getUserTeams(userId)
      const teamIds = userTeams.length > 0 ? userTeams : ["00000000-0000-0000-0000-000000000000"]

      recentActivityQuery = `
        SELECT 
          t.id,
          t.subject,
          t.status,
          t.priority,
          t.created_at,
          t.updated_at,
          c.first_name || ' ' || c.last_name as customer_name,
          u.first_name || ' ' || u.last_name as assigned_user_name
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN users u ON t.assigned_to_user_id = u.id
        WHERE t.organization_id = $1 
        AND (t.assigned_to_user_id = $2 OR t.assigned_to_team_id = ANY($3))
        ORDER BY t.updated_at DESC
        LIMIT 10
      `
    }

    const recentActivityParams = hasFullAccess(user.role)
      ? [user.organizationId]
      : [user.organizationId, userId, await getUserTeams(userId)]

    const recentActivity = await sql.unsafe(recentActivityQuery, recentActivityParams)

    return NextResponse.json({
      ticketStats: ticketStats[0],
      customerStats: customerStats[0],
      recentActivity,
      userRole: user.role,
      userName: `${user.firstName} ${user.lastName}`,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
