// Tickets API with RBAC
import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { withAuth, buildOrganizationFilter, buildUserAccessFilter } from "@/lib/rbac-middleware"
import { getUserTeams, hasFullAccess } from "@/lib/auth"

const getDatabaseUrl = () => {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!url) {
    throw new Error("No database connection string found. Please check your environment variables.")
  }

  return url
}

const sql = neon(getDatabaseUrl())

export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const assignedTo = searchParams.get("assignedTo")

    const { user } = context
    const userTeams = await getUserTeams(user.id)

    let whereClause = buildOrganizationFilter(user.organizationId)

    // Apply RBAC filtering
    if (!hasFullAccess(user.role)) {
      const accessFilter = buildUserAccessFilter(user.id, user.role, userTeams)
      whereClause += ` AND (${accessFilter})`
    }

    // Apply additional filters
    if (status) {
      whereClause += ` AND status = '${status}'`
    }
    if (priority) {
      whereClause += ` AND priority = '${priority}'`
    }
    if (assignedTo) {
      whereClause += ` AND assigned_to_user_id = '${assignedTo}'`
    }

    const tickets = await sql`
      SELECT t.*, 
             c.first_name as customer_first_name,
             c.last_name as customer_last_name,
             c.email as customer_email,
             u.first_name as assigned_user_first_name,
             u.last_name as assigned_user_last_name,
             team.name as assigned_team_name
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.assigned_to_user_id = u.id
      LEFT JOIN teams team ON t.assigned_to_team_id = team.id
      WHERE ${sql.unsafe(whereClause)}
      ORDER BY t.created_at DESC
      LIMIT 50
    `

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Get tickets error:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
})

export const POST = withAuth(async (req: NextRequest, context) => {
  try {
    const { subject, description, priority, customerId, assignedToUserId, assignedToTeamId } = await req.json()

    if (!subject || !customerId) {
      return NextResponse.json({ error: "Subject and customer are required" }, { status: 400 })
    }

    const { user } = context

    const [ticket] = await sql`
      INSERT INTO tickets (
        organization_id, subject, description, priority, 
        customer_id, assigned_to_user_id, assigned_to_team_id, created_by_user_id
      )
      VALUES (
        ${user.organizationId}, ${subject}, ${description}, ${priority || "medium"},
        ${customerId}, ${assignedToUserId}, ${assignedToTeamId}, ${user.id}
      )
      RETURNING *
    `

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error("Create ticket error:", error)
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
})
