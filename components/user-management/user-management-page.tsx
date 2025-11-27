"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Plus, Edit, Trash2, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/lib/hooks/use-toast"

interface User {
  id: string
  name: string | null
  email: string
  isActive: boolean
  createdAt: string
  role?: {
    id: string
    name: string
  } | null
  team?: {
    id: string
    name: string
  } | null
}

interface Role {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
}

/**
 * User Management Page component
 */
export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
  })
  const [editFormData, setEditFormData] = useState({
    roleId: "",
    teamId: "",
  })
  const { toast } = useToast()

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users?limit=100")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      if (!response.ok) throw new Error("Failed to fetch roles")
      const data = await response.json()
      setRoles(data.roles || [])
    } catch (error) {
      console.error("Error fetching roles:", error)
    }
  }

  // Fetch teams
  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams?limit=100")
      if (!response.ok) throw new Error("Failed to fetch teams")
      const data = await response.json()
      setTeams(data.teams || [])
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    fetchTeams()
  }, [])

  // Handle create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create user")
      }

      toast({
        title: "Success",
        description: "User created successfully",
      })

      setIsDialogOpen(false)
      setFormData({ name: "", email: "", password: "", roleId: "" })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    }
  }

  // Handle edit button click
  const handleEditClick = (user: User) => {
    setUserToEdit(user)
    setEditFormData({
      roleId: user.role?.id || "none",
      teamId: user.team?.id || "none",
    })
    setEditDialogOpen(true)
  }

  // Handle update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userToEdit) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/users/${userToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: editFormData.roleId === "none" ? null : editFormData.roleId,
          teamId: editFormData.teamId === "none" ? null : editFormData.teamId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update user")
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      setEditDialogOpen(false)
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle delete button click
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteConfirmOpen(true)
  }

  // Handle soft delete user
  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/users/${userToDelete.id}/soft-delete`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete user")
      }

      setDeleteConfirmOpen(false)
      setSuccessDialogOpen(true)
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Manage user accounts and roles</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateUser}>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Create a new user account</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={formData.roleId}
                        onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create User</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge variant={user.role.name === "Admin_Manager" ? "default" : "secondary"}>
                          {user.role.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">No role</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.team ? (
                        <span className="text-sm">{user.team.name}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">No team</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Edit user"
                          onClick={() => handleEditClick(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Delete user"
                          onClick={() => handleDeleteClick(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user role and team assignment</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={userToEdit?.name || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">Name cannot be edited</p>
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={userToEdit?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be edited</p>
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editFormData.roleId}
                  onValueChange={(value) => setEditFormData({ ...editFormData, roleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Role</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-team">Team</Label>
                <Select
                  value={editFormData.teamId}
                  onValueChange={(value) => setEditFormData({ ...editFormData, teamId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update User"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <span className="font-semibold">{userToDelete?.name || userToDelete?.email}</span>?
              </p>
              <p className="text-sm">
                This action will mark the user as deleted but preserve all historical data.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              User Deleted Successfully
            </AlertDialogTitle>
            <AlertDialogDescription>
              The user <span className="font-semibold">{userToDelete?.name || userToDelete?.email}</span> has been successfully deleted. All historical data has been preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuccessDialogOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}