// Team service with RBAC-aware data access
import { sql } from "@/lib/database"
import type { User } from "@/lib/types"
import { getUserTeams, hasFullAccess } from "@/lib/auth"

export interface Team {
  id: string
  organizationId: string
  name: string
  description?: string
  teamLeaderId?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  // Joined fields
  leaderFirstName?: string
  leaderLastName?: string
  memberCount: number
}

export interface CreateTeamData {
  name: string
  description?: string
  teamLeaderId?: string
}

export interface UpdateTeamData {
  name?: string
  description?: string
  teamLeaderId?: string
  isActive?: boolean
}

export class TeamService {
  static async getTeams(user: User): Promise<Team[]> {
    const whereConditions = [`t.organization_id = '${user.organizationId}'`, `t.is_active = true`]

    // Apply RBAC filtering
    if (!hasFullAccess(user.role)) {
      const userTeams = await getUserTeams(user.id)
      if (userTeams.length > 0) {
        whereConditions.push(`t.id IN (${userTeams.map((id) => `'${id}'`).join(", ")})`)
      } else {
        // User has no team access
        return []
      }
    }

    const whereClause = whereConditions.join(" AND ")

    const teams = await sql`
      SELECT t.*, 
             u.first_name as leader_first_name,
             u.last_name as leader_last_name,
             COUNT(tm.user_id) as member_count
      FROM teams t
      LEFT JOIN users u ON t.team_leader_id = u.id
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE ${sql.unsafe(whereClause)}
      GROUP BY t.id, u.first_name, u.last_name
      ORDER BY t.name
    `

    return teams.map(this.mapTeamFromDb)
  }

  static async getTeamById(teamId: string, user: User): Promise<Team | null> {
    const whereConditions = [`t.id = '${teamId}'`, `t.organization_id = '${user.organizationId}'`, `t.is_active = true`]

    // Apply RBAC filtering
    if (!hasFullAccess(user.role)) {
      const userTeams = await getUserTeams(user.id)
      if (!userTeams.includes(teamId)) {
        return null
      }
    }

    const whereClause = whereConditions.join(" AND ")

    const teams = await sql`
      SELECT t.*, 
             u.first_name as leader_first_name,
             u.last_name as leader_last_name,
             COUNT(tm.user_id) as member_count
      FROM teams t
      LEFT JOIN users u ON t.team_leader_id = u.id
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE ${sql.unsafe(whereClause)}
      GROUP BY t.id, u.first_name, u.last_name
      LIMIT 1
    `

    return teams.length > 0 ? this.mapTeamFromDb(teams[0]) : null
  }

  static async createTeam(data: CreateTeamData, user: User): Promise<Team> {
    // Only admin, manager, or team_leader can create teams
    if (!["admin", "manager", "team_leader"].includes(user.role)) {
      throw new Error("Insufficient permissions to create team")
    }

    const [team] = await sql`
      INSERT INTO teams (organization_id, name, description, team_leader_id)
      VALUES (${user.organizationId}, ${data.name}, ${data.description}, ${data.teamLeaderId})
      RETURNING *
    `

    return this.mapTeamFromDb({ ...team, member_count: 0 })
  }

  static async updateTeam(teamId: string, data: UpdateTeamData, user: User): Promise<Team | null> {
    // Check if user can access this team
    const existingTeam = await this.getTeamById(teamId, user)
    if (!existingTeam) {
      return null
    }

    // Only admin, manager, or team leader can update teams
    if (!hasFullAccess(user.role) && existingTeam.teamLeaderId !== user.id) {
      throw new Error("Insufficient permissions to update team")
    }

    const updateFields = []
    const updateValues = []

    if (data.name !== undefined) {
      updateFields.push("name = $" + (updateValues.length + 1))
      updateValues.push(data.name)
    }
    if (data.description !== undefined) {
      updateFields.push("description = $" + (updateValues.length + 1))
      updateValues.push(data.description)
    }
    if (data.teamLeaderId !== undefined) {
      updateFields.push("team_leader_id = $" + (updateValues.length + 1))
      updateValues.push(data.teamLeaderId)
    }
    if (data.isActive !== undefined) {
      updateFields.push("is_active = $" + (updateValues.length + 1))
      updateValues.push(data.isActive)
    }

    if (updateFields.length === 0) {
      return existingTeam
    }

    updateFields.push("updated_at = NOW()")
    updateValues.push(teamId)

    const query = `
      UPDATE teams 
      SET ${updateFields.join(", ")}
      WHERE id = $${updateValues.length}
      RETURNING *
    `

    const [updatedTeam] = await sql.unsafe(query, updateValues)
    return this.mapTeamFromDb({ ...updatedTeam, member_count: existingTeam.memberCount })
  }

  static async getTeamMembers(teamId: string, user: User): Promise<any[]> {
    // Check if user can access this team
    const team = await this.getTeamById(teamId, user)
    if (!team) {
      return []
    }

    const members = await sql`
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, tm.joined_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ${teamId} AND u.status = 'active'
      ORDER BY u.first_name, u.last_name
    `

    return members
  }

  static async addTeamMember(teamId: string, userId: string, user: User): Promise<boolean> {
    // Check if user can manage this team
    const team = await this.getTeamById(teamId, user)
    if (!team) {
      return false
    }

    if (!hasFullAccess(user.role) && team.teamLeaderId !== user.id) {
      throw new Error("Insufficient permissions to add team member")
    }

    try {
      await sql`
        INSERT INTO team_members (team_id, user_id)
        VALUES (${teamId}, ${userId})
        ON CONFLICT (team_id, user_id) DO NOTHING
      `
      return true
    } catch (error) {
      console.error("Add team member error:", error)
      return false
    }
  }

  static async removeTeamMember(teamId: string, userId: string, user: User): Promise<boolean> {
    // Check if user can manage this team
    const team = await this.getTeamById(teamId, user)
    if (!team) {
      return false
    }

    if (!hasFullAccess(user.role) && team.teamLeaderId !== user.id) {
      throw new Error("Insufficient permissions to remove team member")
    }

    try {
      await sql`
        DELETE FROM team_members
        WHERE team_id = ${teamId} AND user_id = ${userId}
      `
      return true
    } catch (error) {
      console.error("Remove team member error:", error)
      return false
    }
  }

  private static mapTeamFromDb(dbTeam: any): Team {
    return {
      id: dbTeam.id,
      organizationId: dbTeam.organization_id,
      name: dbTeam.name,
      description: dbTeam.description,
      teamLeaderId: dbTeam.team_leader_id,
      createdAt: dbTeam.created_at,
      updatedAt: dbTeam.updated_at,
      isActive: dbTeam.is_active,
      leaderFirstName: dbTeam.leader_first_name,
      leaderLastName: dbTeam.leader_last_name,
      memberCount: Number.parseInt(dbTeam.member_count?.toString() || "0"),
    }
  }
}
