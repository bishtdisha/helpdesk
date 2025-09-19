// Customer service with RBAC-aware data access
import { sql } from "@/lib/database"
import type { User } from "@/lib/types"

export interface Customer {
  id: string
  organizationId: string
  email: string
  firstName?: string
  lastName?: string
  company?: string
  phone?: string
  address?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface CreateCustomerData {
  email: string
  firstName?: string
  lastName?: string
  company?: string
  phone?: string
  address?: string
  notes?: string
}

export interface UpdateCustomerData {
  email?: string
  firstName?: string
  lastName?: string
  company?: string
  phone?: string
  address?: string
  notes?: string
  isActive?: boolean
}

export class CustomerService {
  static async getCustomers(
    user: User,
    options: { limit?: number; offset?: number; search?: string } = {},
  ): Promise<{ customers: Customer[]; total: number }> {
    const { limit = 20, offset = 0, search } = options

    const whereConditions = [`organization_id = '${user.organizationId}'`, `is_active = true`]

    if (search) {
      whereConditions.push(`(
        first_name ILIKE '%${search}%' OR 
        last_name ILIKE '%${search}%' OR 
        email ILIKE '%${search}%' OR 
        company ILIKE '%${search}%'
      )`)
    }

    const whereClause = whereConditions.join(" AND ")

    const [customers, countResult] = await Promise.all([
      sql`
        SELECT *
        FROM customers
        WHERE ${sql.unsafe(whereClause)}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) as count
        FROM customers
        WHERE ${sql.unsafe(whereClause)}
      `,
    ])

    return {
      customers: customers.map(this.mapCustomerFromDb),
      total: Number.parseInt(countResult[0]?.count?.toString() || "0"),
    }
  }

  static async getCustomerById(customerId: string, user: User): Promise<Customer | null> {
    const customers = await sql`
      SELECT *
      FROM customers
      WHERE id = ${customerId} 
      AND organization_id = ${user.organizationId}
      AND is_active = true
      LIMIT 1
    `

    return customers.length > 0 ? this.mapCustomerFromDb(customers[0]) : null
  }

  static async createCustomer(data: CreateCustomerData, user: User): Promise<Customer> {
    const [customer] = await sql`
      INSERT INTO customers (
        organization_id, email, first_name, last_name, 
        company, phone, address, notes
      )
      VALUES (
        ${user.organizationId}, ${data.email}, ${data.firstName}, ${data.lastName},
        ${data.company}, ${data.phone}, ${data.address}, ${data.notes}
      )
      RETURNING *
    `

    return this.mapCustomerFromDb(customer)
  }

  static async updateCustomer(customerId: string, data: UpdateCustomerData, user: User): Promise<Customer | null> {
    // Check if customer exists and user has access
    const existingCustomer = await this.getCustomerById(customerId, user)
    if (!existingCustomer) {
      return null
    }

    const updateFields = []
    const updateValues = []

    if (data.email !== undefined) {
      updateFields.push("email = $" + (updateValues.length + 1))
      updateValues.push(data.email)
    }
    if (data.firstName !== undefined) {
      updateFields.push("first_name = $" + (updateValues.length + 1))
      updateValues.push(data.firstName)
    }
    if (data.lastName !== undefined) {
      updateFields.push("last_name = $" + (updateValues.length + 1))
      updateValues.push(data.lastName)
    }
    if (data.company !== undefined) {
      updateFields.push("company = $" + (updateValues.length + 1))
      updateValues.push(data.company)
    }
    if (data.phone !== undefined) {
      updateFields.push("phone = $" + (updateValues.length + 1))
      updateValues.push(data.phone)
    }
    if (data.address !== undefined) {
      updateFields.push("address = $" + (updateValues.length + 1))
      updateValues.push(data.address)
    }
    if (data.notes !== undefined) {
      updateFields.push("notes = $" + (updateValues.length + 1))
      updateValues.push(data.notes)
    }
    if (data.isActive !== undefined) {
      updateFields.push("is_active = $" + (updateValues.length + 1))
      updateValues.push(data.isActive)
    }

    if (updateFields.length === 0) {
      return existingCustomer
    }

    updateFields.push("updated_at = NOW()")
    updateValues.push(customerId)

    const query = `
      UPDATE customers 
      SET ${updateFields.join(", ")}
      WHERE id = $${updateValues.length}
      RETURNING *
    `

    const [updatedCustomer] = await sql.unsafe(query, updateValues)
    return this.mapCustomerFromDb(updatedCustomer)
  }

  static async getCustomerStats(user: User): Promise<{
    total: number
    active: number
    newThisMonth: number
  }> {
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as new_this_month
      FROM customers
      WHERE organization_id = ${user.organizationId}
    `

    return {
      total: Number.parseInt(stats[0]?.total?.toString() || "0"),
      active: Number.parseInt(stats[0]?.active?.toString() || "0"),
      newThisMonth: Number.parseInt(stats[0]?.new_this_month?.toString() || "0"),
    }
  }

  private static mapCustomerFromDb(dbCustomer: any): Customer {
    return {
      id: dbCustomer.id,
      organizationId: dbCustomer.organization_id,
      email: dbCustomer.email,
      firstName: dbCustomer.first_name,
      lastName: dbCustomer.last_name,
      company: dbCustomer.company,
      phone: dbCustomer.phone,
      address: dbCustomer.address,
      notes: dbCustomer.notes,
      createdAt: dbCustomer.created_at,
      updatedAt: dbCustomer.updated_at,
      isActive: dbCustomer.is_active,
    }
  }
}
