import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { withAuth, buildOrganizationFilter } from "@/lib/rbac-middleware"
import { hasFullAccess, getUserTeams } from "@/lib/auth"

export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const { user } = context
    let whereClause = buildOrganizationFilter(user.organizationId)

    if (!hasFullAccess(user.role)) {
      // Non-admin users can only see customers from tickets they have access to
      const userTeams = await getUserTeams(user.id)
      const teamIds = userTeams.length > 0 ? userTeams.map((id) => `'${id}'`).join(", ") : "''"

      whereClause += ` AND c.id IN (
        SELECT DISTINCT t.customer_id 
        FROM tickets t 
        WHERE t.organization_id = '${user.organizationId}' 
        AND (t.assigned_to_user_id = '${user.id}' OR t.assigned_to_team_id IN (${teamIds}))
      )`
    }

    // Apply search filter
    if (search) {
      whereClause += ` AND (
        c.first_name ILIKE '%${search}%' OR 
        c.last_name ILIKE '%${search}%' OR 
        c.email ILIKE '%${search}%' OR 
        c.company ILIKE '%${search}%'
      )`
    }

    const customers = await sql.unsafe(`
      SELECT c.*, 
             COUNT(t.id) as ticket_count,
             MAX(t.created_at) as last_ticket_date
      FROM customers c
      LEFT JOIN tickets t ON c.id = t.customer_id
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    // Get total count for pagination
    const countResult = await sql.unsafe(`
      SELECT COUNT(DISTINCT c.id) as total
      FROM customers c
      LEFT JOIN tickets t ON c.id = t.customer_id
      WHERE ${whereClause}
    `)

    return NextResponse.json({
      customers,
      total: Number.parseInt(countResult[0]?.total || "0"),
      limit,
      offset,
    })
  } catch (error) {
    console.error("Get customers error:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
})

export const POST = withAuth(async (req: NextRequest, context) => {
  try {
    const { email, firstName, lastName, company, phone, address, notes } = await req.json()

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        {
          error: "Email, first name, and last name are required",
        },
        { status: 400 },
      )
    }

    const { user } = context

    // Check if customer already exists
    const existingCustomer = await sql`
      SELECT id FROM customers 
      WHERE organization_id = ${user.organizationId} 
      AND email = ${email}
      LIMIT 1
    `

    if (existingCustomer.length > 0) {
      return NextResponse.json(
        {
          error: "Customer with this email already exists",
        },
        { status: 409 },
      )
    }

    const [customer] = await sql`
      INSERT INTO customers (
        organization_id, email, first_name, last_name, 
        company, phone, address, notes
      )
      VALUES (
        ${user.organizationId}, ${email}, ${firstName}, ${lastName},
        ${company}, ${phone}, ${address}, ${notes}
      )
      RETURNING *
    `

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error("Create customer error:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
})
