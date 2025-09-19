// Shared types for authentication and RBAC
export type UserRole = "admin" | "manager" | "team_leader" | "user"
export type UserStatus = "active" | "inactive" | "suspended"

export interface User {
  id: string
  organizationId: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatarUrl?: string
  role: UserRole
  status: UserStatus
  lastLoginAt?: Date
  emailVerifiedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AuthSession {
  user: User
  sessionToken: string
  expiresAt: Date
}

export interface Ticket {
  id: string
  organizationId: string
  customerId: string
  assignedToId?: string
  teamId?: string
  title: string
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  closedAt?: Date
}

export interface Customer {
  id: string
  organizationId: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  company?: string
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

export interface Team {
  id: string
  organizationId: string
  name: string
  description?: string
  teamLeaderId: string
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}
