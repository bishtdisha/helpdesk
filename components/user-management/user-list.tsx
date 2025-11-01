"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { 
  SafeUserWithRole, 
  UserFilters, 
  UserListResponse,
  Role,
  Team 
} from '@/lib/types/rbac';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface UserListProps {
  onCreateUser?: () => void;
  onEditUser?: (user: SafeUserWithRole) => void;
  onDeleteUser?: (user: SafeUserWithRole) => void;
  onViewUser?: (user: SafeUserWithRole) => void;
}

export function UserList({ 
  onCreateUser, 
  onEditUser, 
  onDeleteUser, 
  onViewUser 
}: UserListProps) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<SafeUserWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 10;
  
  // Filter state
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    roleId: '',
    teamId: '',
    isActive: undefined,
  });
  
  // Debounced search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Load users with filters and pagination
  const loadUsers = async (page = 1, currentFilters = filters) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.roleId) params.append('roleId', currentFilters.roleId);
      if (currentFilters.teamId) params.append('teamId', currentFilters.teamId);
      if (currentFilters.isActive !== undefined) {
        params.append('isActive', currentFilters.isActive.toString());
      }
      
      const response = await fetch(`/api/users?${params}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      
      const data: UserListResponse = await response.json();
      setUsers(data.users);
      setTotalUsers(data.total);
      setTotalPages(Math.ceil(data.total / limit));
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  // Load roles and teams for filters
  const loadFiltersData = async () => {
    try {
      const [rolesResponse, teamsResponse] = await Promise.all([
        fetch('/api/roles', { credentials: 'include' }),
        fetch('/api/teams', { credentials: 'include' })
      ]);
      
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);
      }
      
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(teamsData.teams || []);
      }
    } catch (err) {
      console.error('Failed to load filter data:', err);
    }
  };
  
  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Load users when filters change
  useEffect(() => {
    loadUsers(1, filters);
  }, [filters, isAuthenticated]);
  
  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadFiltersData();
    }
  }, [isAuthenticated]);
  
  // Handle filter changes
  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      search: '',
      roleId: '',
      teamId: '',
      isActive: undefined,
    });
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadUsers(page);
    }
  };
  
  // Get user status badge
  const getUserStatusBadge = (user: SafeUserWithRole) => {
    if (!user.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    return <Badge variant="secondary">Active</Badge>;
  };
  
  // Get role badge
  const getRoleBadge = (role: Role | null) => {
    if (!role) return <Badge variant="outline">No Role</Badge>;
    
    const variant = role.name === 'Admin/Manager' ? 'default' : 
                   role.name === 'Team Leader' ? 'secondary' : 'outline';
    
    return <Badge variant={variant}>{role.name}</Badge>;
  };
  
  // Check if current user can perform actions
  const canCreateUsers = currentUser?.role?.name === 'Admin/Manager';
  const canEditUser = (user: SafeUserWithRole) => {
    if (!currentUser) return false;
    if (currentUser.role?.name === 'Admin/Manager') return true;
    if (currentUser.role?.name === 'Team Leader' && user.teamId === currentUser.teamId) return true;
    return user.id === currentUser.id;
  };
  const canDeleteUser = (user: SafeUserWithRole) => {
    return currentUser?.role?.name === 'Admin/Manager' && user.id !== currentUser.id;
  };
  
  if (!isAuthenticated) {
    return <div>Please log in to view users.</div>;
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage users, roles, and team assignments
          </p>
        </div>
        {canCreateUsers && (
          <Button onClick={onCreateUser}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        )}
      </div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select
              value={filters.roleId || ''}
              onValueChange={(value) => handleFilterChange('roleId', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Team</label>
            <Select
              value={filters.teamId || ''}
              onValueChange={(value) => handleFilterChange('teamId', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.isActive === undefined ? '' : filters.isActive.toString()}
              onValueChange={(value) => 
                handleFilterChange('isActive', value === '' ? undefined : value === 'true')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={clearFilters}>
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </Card>
      
      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}
      
      {/* Users table */}
      <Card>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">
              Users ({totalUsers})
            </h3>
            {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.team ? user.team.name : <span className="text-muted-foreground">No team</span>}
                  </TableCell>
                  <TableCell>{getUserStatusBadge(user)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewUser?.(user)}
                      >
                        View
                      </Button>
                      {canEditUser(user) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditUser?.(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDeleteUser(user) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteUser?.(user)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}