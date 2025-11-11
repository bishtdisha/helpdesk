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
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Alert } from "@/components/ui/alert"
import { Loader2, Search, UserPlus, X, Users } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"

interface Follower {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
  }
  addedAt: Date
}

interface UserOption {
  id: string
  name: string
  email: string
  teamId?: string
}

interface FollowerManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId: string
  onSuccess?: () => void
}

export function FollowerManagementDialog({
  open,
  onOpenChange,
  ticketId,
  onSuccess,
}: FollowerManagementDialogProps) {
  const { user } = useAuth()
  const [followers, setFollowers] = useState<Follower[]>([])
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const isAdmin = user?.role?.name === 'Admin/Manager'
  const isTeamLeader = user?.role?.name === 'Team Leader'

  // Fetch followers and available users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch current followers
        const followersResponse = await fetch(`/api/tickets/${ticketId}/followers`)
        if (followersResponse.ok) {
          const followersData = await followersResponse.json()
          setFollowers(followersData)
        }

        // Fetch available users
        const usersResponse = await fetch('/api/users')
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setAvailableUsers(usersData.users || usersData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load follower data')
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open, ticketId])

  const handleAddFollower = async (userId: string) => {
    try {
      setActionInProgress(userId)
      setError(null)

      const response = await fetch(`/api/tickets/${ticketId}/followers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add follower')
      }

      // Refresh followers list
      const followersResponse = await fetch(`/api/tickets/${ticketId}/followers`)
      if (followersResponse.ok) {
        const followersData = await followersResponse.json()
        setFollowers(followersData)
      }

      onSuccess?.()
    } catch (error) {
      console.error('Error adding follower:', error)
      setError(error instanceof Error ? error.message : 'Failed to add follower')
    } finally {
      setActionInProgress(null)
    }
  }

  const handleRemoveFollower = async (userId: string) => {
    try {
      setActionInProgress(userId)
      setError(null)

      const response = await fetch(`/api/tickets/${ticketId}/followers/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to remove follower')
      }

      // Refresh followers list
      const followersResponse = await fetch(`/api/tickets/${ticketId}/followers`)
      if (followersResponse.ok) {
        const followersData = await followersResponse.json()
        setFollowers(followersData)
      }

      onSuccess?.()
    } catch (error) {
      console.error('Error removing follower:', error)
      setError(error instanceof Error ? error.message : 'Failed to remove follower')
    } finally {
      setActionInProgress(null)
    }
  }

  const canAddFollower = () => {
    // Admin and Team Leader can add followers
    return isAdmin || isTeamLeader
  }

  const canRemoveFollower = (followerId: string) => {
    // Admin and Team Leader can remove any follower
    if (isAdmin || isTeamLeader) return true
    // Users can remove themselves
    return followerId === user?.id
  }

  // Filter users for search
  const filteredUsers = availableUsers.filter(u => {
    // Don't show users who are already followers
    if (followers.some(f => f.userId === u.id)) return false
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      )
    }
    
    return true
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Followers
          </DialogTitle>
          <DialogDescription>
            Add or remove followers who will receive notifications about this ticket
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
          <div className="space-y-6">
            {/* Current Followers */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Current Followers ({followers.length})</h3>
              {followers.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4 bg-muted rounded-lg">
                  No followers yet
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {followers.map((follower) => (
                    <div
                      key={follower.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <div className="bg-primary text-primary-foreground flex items-center justify-center h-full">
                            {follower.user.name?.charAt(0) || 'U'}
                          </div>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{follower.user.name}</div>
                          <div className="text-xs text-muted-foreground">{follower.user.email}</div>
                        </div>
                      </div>
                      {canRemoveFollower(follower.userId) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFollower(follower.userId)}
                          disabled={actionInProgress === follower.userId}
                        >
                          {actionInProgress === follower.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Followers */}
            {canAddFollower() && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Add Followers</h3>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Available Users */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4 bg-muted rounded-lg">
                      {searchTerm ? 'No users found' : 'All users are already followers'}
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <div className="bg-primary text-primary-foreground flex items-center justify-center h-full">
                              {user.name?.charAt(0) || 'U'}
                            </div>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddFollower(user.id)}
                          disabled={actionInProgress === user.id}
                        >
                          {actionInProgress === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Permission Info */}
            {!canAddFollower() && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  You can only remove yourself as a follower. Contact an admin or team leader to add new followers.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
