// Ticket service with RBAC-aware data access
import { sql } from "@/lib/database"
import type { User } from "@/lib/types"
import { getUserTeams, hasFullAccess } from "@/lib/auth"

export interface Ticket {
  id: string
  organizationId: string
  ticketNumber: string
  subject: string
  description?: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "new" | "open" | "pending" | "resolved" | "closed" | "cancelled"
  categoryId?: string
  customerId: string
  assignedToUserId?: string
  assignedToTeamId?: string
  createdByUserId?: string
  dueDate?: Date
  resolvedAt?: Date
  closedAt?: Date
  createdAt: Date
  updatedAt: Date
  // Joined fields
  customerFirstName?: string
  customerLastName?: string
  customerEmail?: string
  assignedUserFirstName?: string
  assignedUserLastName?: string
  assignedTeamName?: string
}

export interface CreateTicketData {
  subject: string
  description?: string
  priority?: "low" | "medium" | "high" | "urgent"
  categoryId?: string
  customerId: string
  assignedToUserId?: string
  assignedToTeamId?: string
  dueDate?: Date
}

export interface UpdateTicketData {
  subject?: string
  description?: string
  priority?: "low" | "medium" | "high" | "urgent"
  status?: "new" | "open" | "pending" | "resolved" | "closed" | "cancelled"
  assignedToUserId?: string
  assignedToTeamId?: string
  dueDate?: Date
}

export interface TicketFilters {
  status?: string
  priority?: string
  assignedToUserId?: string
  assignedToTeamId?: string
  customerId?: string
  search?: string
}

export class TicketService {
  static async getTickets(
    user: User,
    filters: TicketFilters = {},
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ tickets: Ticket[]; total: number }> {
    const { limit = 20, offset = 0 } = options
    const userTeams = await getUserTeams(user.id)

    const whereConditions = [`t.organization_id = '${user.organizationId}'`]

    // Apply RBAC filtering
    if (!hasFullAccess(user.role)) {
      const accessConditions = [`t.assigned_to_user_id = '${user.id}'`]

      if (userTeams.length > 0) {
        accessConditions.push(`t.assigned_to_team_id IN (${userTeams.map((id) => `'${id}'`).join(", ")})`)
      }

      whereConditions.push(`(${accessConditions.join(" OR ")})`)
    }

    // Apply filters
    if (filters.status) {
      whereConditions.push(`t.status = '${filters.status}'`)
    }
    if (filters.priority) {
      whereConditions.push(`t.priority = '${filters.priority}'`)
    }
    if (filters.assignedToUserId) {
      whereConditions.push(`t.assigned_to_user_id = '${filters.assignedToUserId}'`)
    }
    if (filters.assignedToTeamId) {
      whereConditions.push(`t.assigned_to_team_id = '${filters.assignedToTeamId}'`)
    }
    if (filters.customerId) {
      whereConditions.push(`t.customer_id = '${filters.customerId}'`)
    }
    if (filters.search) {
      whereConditions.push(`(t.subject ILIKE '%${filters.search}%' OR t.description ILIKE '%${filters.search}%')`)
    }

    const whereClause = whereConditions.join(" AND ")

    const [tickets, countResult] = await Promise.all([
      sql`
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
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) as count
        FROM tickets t
        WHERE ${sql.unsafe(whereClause)}
      `,
    ])

    return {
      tickets: tickets.map(this.mapTicketFromDb),
      total: Number.parseInt(countResult[0]?.count?.toString() || "0"),
    }
  }

  static async getTicketById(ticketId: string, user: User): Promise<Ticket | null> {
    const userTeams = await getUserTeams(user.id)

    const whereConditions = [`t.id = '${ticketId}'`, `t.organization_id = '${user.organizationId}'`]

    // Apply RBAC filtering
    if (!hasFullAccess(user.role)) {
      const accessConditions = [`t.assigned_to_user_id = '${user.id}'`]

      if (userTeams.length > 0) {
        accessConditions.push(`t.assigned_to_team_id IN (${userTeams.map((id) => `'${id}'`).join(", ")})`)
      }

      whereConditions.push(`(${accessConditions.join(" OR ")})`)
    }

    const whereClause = whereConditions.join(" AND ")

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
      LIMIT 1
    `

    return tickets.length > 0 ? this.mapTicketFromDb(tickets[0]) : null
  }

  static async createTicket(data: CreateTicketData, user: User): Promise<Ticket> {
    const [ticket] = await sql`
      INSERT INTO tickets (
        organization_id, subject, description, priority, category_id,
        customer_id, assigned_to_user_id, assigned_to_team_id, created_by_user_id, due_date
      )
      VALUES (
        ${user.organizationId}, ${data.subject}, ${data.description}, ${data.priority || "medium"},
        ${data.categoryId}, ${data.customerId}, ${data.assignedToUserId}, ${data.assignedToTeamId},
        ${user.id}, ${data.dueDate}
      )
      RETURNING *
    `

    return this.mapTicketFromDb(ticket)
  }

  static async updateTicket(ticketId: string, data: UpdateTicketData, user: User): Promise<Ticket | null> {
    // First check if user can access this ticket
    const existingTicket = await this.getTicketById(ticketId, user)
    if (!existingTicket) {
      return null
    }

    const updateFields = []
    const updateValues = []

    if (data.subject !== undefined) {
      updateFields.push("subject = $" + (updateValues.length + 1))
      updateValues.push(data.subject)
    }
    if (data.description !== undefined) {
      updateFields.push("description = $" + (updateValues.length + 1))
      updateValues.push(data.description)
    }
    if (data.priority !== undefined) {
      updateFields.push("priority = $" + (updateValues.length + 1))
      updateValues.push(data.priority)
    }
    if (data.status !== undefined) {
      updateFields.push("status = $" + (updateValues.length + 1))
      updateValues.push(data.status)

      // Set resolved_at or closed_at based on status
      if (data.status === "resolved") {
        updateFields.push("resolved_at = NOW()")
      } else if (data.status === "closed") {
        updateFields.push("closed_at = NOW()")
      }
    }
    if (data.assignedToUserId !== undefined) {
      updateFields.push("assigned_to_user_id = $" + (updateValues.length + 1))
      updateValues.push(data.assignedToUserId)
    }
    if (data.assignedToTeamId !== undefined) {
      updateFields.push("assigned_to_team_id = $" + (updateValues.length + 1))
      updateValues.push(data.assignedToTeamId)
    }
    if (data.dueDate !== undefined) {
      updateFields.push("due_date = $" + (updateValues.length + 1))
      updateValues.push(data.dueDate)
    }

    if (updateFields.length === 0) {
      return existingTicket
    }

    updateFields.push("updated_at = NOW()")
    updateValues.push(ticketId)

    const query = `
      UPDATE tickets 
      SET ${updateFields.join(", ")}
      WHERE id = $${updateValues.length}
      RETURNING *
    `

    const [updatedTicket] = await sql.unsafe(query, updateValues)
    return this.mapTicketFromDb(updatedTicket)
  }

  static async getTicketStats(user: User): Promise<{
    total: number
    new: number
    open: number
    pending: number
    resolved: number
    closed: number
  }> {
    const userTeams = await getUserTeams(user.id)

    const whereConditions = [`organization_id = '${user.organizationId}'`]

    // Apply RBAC filtering
    if (!hasFullAccess(user.role)) {
      const accessConditions = [`assigned_to_user_id = '${user.id}'`]

      if (userTeams.length > 0) {
        accessConditions.push(`assigned_to_team_id IN (${userTeams.map((id) => `'${id}'`).join(", ")})`)
      }

      whereConditions.push(`(${accessConditions.join(" OR ")})`)
    }

    const whereClause = whereConditions.join(" AND ")

    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'new') as new,
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE status = 'closed') as closed
      FROM tickets
      WHERE ${sql.unsafe(whereClause)}
    `

    return {
      total: Number.parseInt(stats[0]?.total?.toString() || "0"),
      new: Number.parseInt(stats[0]?.new?.toString() || "0"),
      open: Number.parseInt(stats[0]?.open?.toString() || "0"),
      pending: Number.parseInt(stats[0]?.pending?.toString() || "0"),
      resolved: Number.parseInt(stats[0]?.resolved?.toString() || "0"),
      closed: Number.parseInt(stats[0]?.closed?.toString() || "0"),
    }
  }

  private static mapTicketFromDb(dbTicket: any): Ticket {
    return {
      id: dbTicket.id,
      organizationId: dbTicket.organization_id,
      ticketNumber: dbTicket.ticket_number,
      subject: dbTicket.subject,
      description: dbTicket.description,
      priority: dbTicket.priority,
      status: dbTicket.status,
      categoryId: dbTicket.category_id,
      customerId: dbTicket.customer_id,
      assignedToUserId: dbTicket.assigned_to_user_id,
      assignedToTeamId: dbTicket.assigned_to_team_id,
      createdByUserId: dbTicket.created_by_user_id,
      dueDate: dbTicket.due_date,
      resolvedAt: dbTicket.resolved_at,
      closedAt: dbTicket.closed_at,
      createdAt: dbTicket.created_at,
      updatedAt: dbTicket.updated_at,
      customerFirstName: dbTicket.customer_first_name,
      customerLastName: dbTicket.customer_last_name,
      customerEmail: dbTicket.customer_email,
      assignedUserFirstName: dbTicket.assigned_user_first_name,
      assignedUserLastName: dbTicket.assigned_user_last_name,
      assignedTeamName: dbTicket.assigned_team_name,
    }
  }
}
