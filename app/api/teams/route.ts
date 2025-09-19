// Teams API with RBAC
import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { withAuth, requireTeamManagement, buildOrganizationFilter } from "@/lib/rbac-middleware"
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
    const { user } = context
    let whereClause = buildOrganizationFilter(user.organizationId)

    // Apply RBAC filtering for team access
    if (!hasFullAccess(user.role)) {
      const userTeams = await getUserTeams(user.id)
      if (userTeams.length > 0) {
        whereClause += ` AND id IN (${userTeams.map((id) => `'${id}'`).join(", ")})`
      } else {
        // User has no team access
        return NextResponse.json({ teams: [] })
      }
    }

    const teams = await sql`
      SELECT t.*, 
             u.first_name as leader_first_name,
             u.last_name as leader_last_name,
             COUNT(tm.user_id) as member_count
      FROM teams t
      LEFT JOIN users u ON t.team_leader_id = u.id
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE ${sql.unsafe(whereClause)} AND t.is_active = true
      GROUP BY t.id, u.first_name, u.last_name
      ORDER BY t.name
    `

    return NextResponse.json({ teams })
  } catch (error) {
    console.error("Get teams error:", error)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
})

export const POST = requireTeamManagement()(async (req: NextRequest, context) => {
  try {
    const { name, description, teamLeaderId } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    const { user } = context

    const [team] = await sql`
      INSERT INTO teams (organization_id, name, description, team_leader_id)
      VALUES (${user.organizationId}, ${name}, ${description}, ${teamLeaderId})
      RETURNING *
    `

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error("Create team error:", error)
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
  }
})
