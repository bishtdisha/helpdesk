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
import { 
  Users, Plus, Edit, Trash2, Loader2, AlertTriangle, CheckCircle2, 
  Search, Filter, X, Eye, EyeOff, Shield
} from "lucide-react"
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
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
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
    confirmPassword: "",
    roleId: "",
    teamId: "none",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [editFormData, setEditFormData] = useState({
    roleId: "",
    teamId: "none",
  })
  const [filters, setFilters] = useState({
    search: "",
    roleId: "all",
    teamId: "all",
    status: "all",
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
      setFilteredUsers(data.users || [])
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

  // Apply filters
  useEffect(() => {
    let filtered = [...users]

    // Search filter (name or email)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      )
    }

    // Role filter
    if (filters.roleId !== "all") {
      if (filters.roleId === "none") {
        filtered = filtered.filter((user) => !user.role)
      } else {
        filtered = filtered.filter((user) => user.role?.id === filters.roleId)
      }
    }

    // Team filter
    if (filters.teamId !== "all") {
      if (filters.teamId === "none") {
        filtered = filtered.filter((user) => !user.team)
      } else {
        filtered = filtered.filter((user) => user.team?.id === filters.teamId)
      }
    }

    // Status filter
    if (filters.status !== "all") {
      const isActive = filters.status === "active"
      filtered = filtered.filter((user) => user.isActive === isActive)
    }

    setFilteredUsers(filtered)
  }, [filters, users])

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      roleId: "all",
      teamId: "all",
      status: "all",
    })
  }

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      const data = await response.json()
      console.log("Roles API response:", data)
      if (!response.ok) {
        console.error("Roles API error:", data)
        return
      }
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
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }
    
    // Validate password length
    if (formData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      })
      return
    }
    
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId || undefined,
          teamId: formData.teamId === "none" ? undefined : formData.teamId,
        }),
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
      setFormData({ name: "", email: "", password: "", confirmPassword: "", roleId: "", teamId: "none" })
      setShowPassword(false)
      setShowConfirmPassword(false)
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
      roleId: user.role?.id || "",
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
          roleId: editFormData.roleId || null,
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
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 border border-blue-100 dark:border-blue-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">User Management</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage user accounts, roles, and permissions
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-md">
                  <Plus className="mr-2 h-5 w-5" />
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
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Enter password (min 8 characters)"
                          className="pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Password must be at least 8 characters long
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          placeholder="Re-enter password"
                          className="pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
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
                    <div>
                      <Label htmlFor="team">Team</Label>
                      <Select
                        value={formData.teamId}
                        onValueChange={(value) => setFormData({ ...formData, teamId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No team</SelectItem>
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
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create User</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-300 border-l-3 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/30 dark:to-background">
            <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Total Users</p>
                  <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">{users.length}</p>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">All accounts</p>
                </div>
                <div className="p-2 bg-blue-500/15 rounded-lg">
                  <Users className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-300 border-l-3 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/30 dark:to-background">
            <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Unassigned</p>
                  <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">{users.filter(u => !u.team).length}</p>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Without team</p>
                </div>
                <div className="p-2 bg-amber-500/15 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-300 border-l-3 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/30 dark:to-background">
            <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Roles</p>
                  <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">{roles.length}</p>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Permission sets</p>
                </div>
                <div className="p-2 bg-purple-500/15 rounded-lg">
                  <Shield className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-300 border-l-3 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-white dark:from-orange-950/30 dark:to-background">
            <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/10 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Teams</p>
                  <p className="text-2xl font-extrabold text-orange-700 dark:text-orange-300">{teams.length}</p>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Work groups</p>
                </div>
                <div className="p-2 bg-orange-500/15 rounded-lg">
                  <Users className="h-4 w-4 text-orange-700 dark:text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search Section */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="space-y-4">
              {/* Header with Clear Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded">
                    <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-base font-semibold">Filters & Search</span>
                </div>
                {(filters.search || filters.roleId !== "all" || filters.teamId !== "all" || filters.status !== "all") && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {filteredUsers.length} of {users.length} users
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="h-8 px-3 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {/* Search and Filters in Single Row */}
              <div className="flex gap-3 flex-col md:flex-row">
                {/* Search Bar - Takes remaining space */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 h-10"
                  />
                </div>

                {/* Role Filter */}
                <Select
                  value={filters.roleId}
                  onValueChange={(value) => setFilters({ ...filters, roleId: value })}
                >
                  <SelectTrigger className="h-10 w-full md:w-[170px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="none">No Role</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Team Filter */}
                <Select
                  value={filters.teamId}
                  onValueChange={(value) => setFilters({ ...filters, teamId: value })}
                >
                  <SelectTrigger className="h-10 w-full md:w-[170px]">
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    <SelectItem value="none">No Team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger className="h-10 w-full md:w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table Card */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Users Directory</CardTitle>
                <CardDescription className="mt-1">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {users.length === 0 ? "No users yet" : "No matching users"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  {users.length === 0 
                    ? "Get started by creating your first user account" 
                    : "Try adjusting your filters or search terms"}
                </p>
                {users.length === 0 && (
                  <Button onClick={() => setIsDialogOpen(true)} size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First User
                  </Button>
                )}
              </div>
            ) : (
              <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Team</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Joined</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{user.name || "N/A"}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge 
                          variant={user.role.name === "Admin_Manager" ? "default" : "secondary"} 
                          className="font-medium"
                        >
                          {user.role.name.replace(/_/g, ' ')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-normal text-muted-foreground">
                          No role
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.team ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          <span className="text-sm font-medium">{user.team.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.isActive ? "default" : "secondary"} 
                        className={user.isActive ? "bg-green-500 hover:bg-green-600 font-medium" : "font-medium"}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Edit user"
                          onClick={() => handleEditClick(user)}
                          className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Delete user"
                          onClick={() => handleDeleteClick(user)}
                          className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950"
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
                    <SelectValue placeholder="Select role">
                      {editFormData.roleId && roles.find(r => r.id === editFormData.roleId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length === 0 ? (
                      <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                    ) : (
                      roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))
                    )}
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

