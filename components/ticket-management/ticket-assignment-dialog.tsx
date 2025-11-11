"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert } from "@/components/ui/alert"
import { Loader2, User, Users } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"

interface Team {
  id: string
  name: string
  description?: string
}

interface UserOption {
  id: string
  name: string
  email: string
  teamId?: string
  teamName?: string
}

interface TicketAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId: string
  currentAssigneeId?: string | null
  currentTeamId?: string | null
  onSuccess?: () => void
}

export function TicketAssignmentDialog({
  open,
  onOpenChange,
  ticketId,
  currentAssigneeId,
  currentTeamId,
  onSuccess,
}: TicketAssignmentDialogProps) {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>(currentTeamId || "")
  const [selectedUserId, setSelectedUserId] = useState<string>(currentAssigneeId || "")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.role?.name === 'Admin/Manager'
  const isTeamLeader = user?.role?.name === 'Team Leader'

  // Fetch teams and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch teams (only for Admin)
        if (isAdmin) {
          const teamsResponse = await fetch('/api/teams')
          if (teamsResponse.ok) {
            const teamsData = await response.json()
            setTeams(teamsData)
          }
        }

        // Fetch users
        const usersResponse = await fetch('/api/users')
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          
          // For Team Leaders, filter to only show team members
          if (isTeamLeader && user?.teamId) {
            const filteredUsers = usersData.users.filter(
              (u: UserOption) => u.teamId === user.teamId
            )
            setUsers(filteredUsers)
          } else {
            setUsers(usersData.users || usersData)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load assignment options')
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open, isAdmin, isTeamLeader, user?.teamId])

  // Filter users by selected team
  const filteredUsers = selectedTeamId
    ? users.filter(u => u.teamId === selectedTeamId)
    : users

  const handleAssign = async () => {
    if (!selectedUserId) {
      setError('Please select a user to assign')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: selectedUserId,
          teamId: selectedTeamId || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to assign ticket')
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error assigning ticket:', error)
      setError(error instanceof Error ? error.message : 'Failed to assign ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnassign = async () => {
    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: null,
          teamId: null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to unassign ticket')
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error unassigning ticket:', error)
      setError(error instanceof Error ? error.message : 'Failed to unassign ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Ticket</DialogTitle>
          <DialogDescription>
            {isAdmin
              ? 'Assign this ticket to a team member. You can select any team and user.'
              : 'Assign this ticket to a member of your team.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Team Selection (Admin only) */}
            {isAdmin && teams.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="team" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team
                </Label>
                <Select
                  value={selectedTeamId}
                  onValueChange={setSelectedTeamId}
                >
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Select a team (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Teams</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTeamId && (
                  <p className="text-xs text-muted-foreground">
                    Only showing users from the selected team
                  </p>
                )}
              </div>
            )}

            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="assignee" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Assignee *
              </Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select a user to assign" />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {selectedTeamId
                        ? 'No users in this team'
                        : 'No users available'}
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                            {user.teamName && ` • ${user.teamName}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Current Assignment Info */}
            {currentAssigneeId && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Current Assignment</p>
                <p className="text-sm text-muted-foreground">
                  {users.find(u => u.id === currentAssigneeId)?.name || 'Unknown User'}
                  {currentTeamId && ` • ${teams.find(t => t.id === currentTeamId)?.name || 'Unknown Team'}`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <div>
            {currentAssigneeId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleUnassign}
                disabled={submitting || loading}
              >
                Unassign
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssign}
              disabled={submitting || loading || !selectedUserId}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Ticket'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
