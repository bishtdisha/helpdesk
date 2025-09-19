// Authentication and RBAC utilities - Server-side only
import { neon } from "@neondatabase/serverless"
import type { User, UserRole, UserStatus } from "./types"

let sqlInstance: ReturnType<typeof neon> | null = null

const getDatabaseUrl = () => {
  // Check if we're on the server side
  if (typeof window !== "undefined") {
    throw new Error("Database connections can only be made on the server side")
  }

  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!url) {
    console.error(
      "Available environment variables:",
      Object.keys(process.env).filter((key) => key.includes("DATABASE") || key.includes("POSTGRES")),
    )
    throw new Error("No database connection string found. Please check your environment variables in Project Settings.")
  }

  return url
}

const getSql = () => {
  if (!sqlInstance) {
    sqlInstance = neon(getDatabaseUrl())
  }
  return sqlInstance
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const sql = getSql()
    const users = await sql`
      SELECT id, organization_id, email, first_name, last_name, phone, avatar_url, 
             role, status, last_login_at, email_verified_at, created_at, updated_at
      FROM users 
      WHERE email = ${email} 
      AND status = 'active'
      LIMIT 1
    `

    if (users.length === 0) {
      return null
    }

    // In a real app, you'd verify the password hash here
    // For demo purposes, we'll skip password verification

    const user = users[0]

    // Update last login
    await sql`
      UPDATE users 
      SET last_login_at = NOW() 
      WHERE id = ${user.id}
    `

    return {
      id: user.id,
      organizationId: user.organization_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      lastLoginAt: user.last_login_at,
      emailVerifiedAt: user.email_verified_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const sql = getSql()
    const users = await sql`
      SELECT id, organization_id, email, first_name, last_name, phone, avatar_url, 
             role, status, last_login_at, email_verified_at, created_at, updated_at
      FROM users 
      WHERE id = ${userId} 
      AND status = 'active'
      LIMIT 1
    `

    if (users.length === 0) {
      return null
    }

    const user = users[0]
    return {
      id: user.id,
      organizationId: user.organization_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      lastLoginAt: user.last_login_at,
      emailVerifiedAt: user.email_verified_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }
  } catch (error) {
    console.error("Get user error:", error)
    return null
  }
}

export function hasFullAccess(role: UserRole): boolean {
  return role === "admin" || role === "manager"
}

export function canManageTeam(role: UserRole): boolean {
  return role === "admin" || role === "manager" || role === "team_leader"
}

export async function canAccessTicket(userId: string, ticketId: string): Promise<boolean> {
  try {
    const sql = getSql()
    const result = await sql`
      SELECT user_can_access_ticket(${userId}::UUID, ${ticketId}::UUID) as can_access
    `
    return result[0]?.can_access || false
  } catch (error) {
    console.error("Ticket access check error:", error)
    return false
  }
}

export async function canAccessTeam(userId: string, teamId: string): Promise<boolean> {
  try {
    const sql = getSql()
    const result = await sql`
      SELECT user_has_team_access(${userId}::UUID, ${teamId}::UUID) as has_access
    `
    return result[0]?.has_access || false
  } catch (error) {
    console.error("Team access check error:", error)
    return false
  }
}

export async function getUserTeams(userId: string): Promise<string[]> {
  try {
    const sql = getSql()
    const teams = await sql`
      SELECT t.id
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE t.team_leader_id = ${userId} OR tm.user_id = ${userId}
    `
    return teams.map((team) => team.id)
  } catch (error) {
    console.error("Get user teams error:", error)
    return []
  }
}
