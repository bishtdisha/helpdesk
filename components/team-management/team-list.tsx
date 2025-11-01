"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { TeamWithMembers, TeamListResponse } from '@/lib/types/rbac';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  Crown,
  Loader2,
} from 'lucide-react';

interface TeamListProps {
  onCreateTeam: () => void;
  onEditTeam: (team: TeamWithMembers) => void;
  onDeleteTeam: (team: TeamWithMembers) => void;
  onViewMembers: (team: TeamWithMembers) => void;
}

export function TeamList({ onCreateTeam, onEditTeam, onDeleteTeam, onViewMembers }: TeamListProps) {
  const { user: currentUser } = useAuth();
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Load teams
  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      const response = await fetch(`/api/teams?${params}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load teams');
      }
      
      const data: TeamListResponse = await response.json();
      setTeams(data.teams);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  // Load teams on mount and when dependencies change
  useEffect(() => {
    loadTeams();
  }, [page, searchTerm]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  };

  // Check permissions
  const canCreateTeams = currentUser?.role?.name === 'Admin/Manager';
  const canEditTeams = currentUser?.role?.name === 'Admin/Manager';
  const canDeleteTeams = currentUser?.role?.name === 'Admin/Manager';
  const canViewMembers = currentUser?.role?.name === 'Admin/Manager' || 
                         currentUser?.role?.name === 'Team Leader';

  // Get team leader names
  const getTeamLeaderNames = (team: TeamWithMembers): string => {
    if (!team.teamLeaders || team.teamLeaders.length === 0) {
      return 'No leader assigned';
    }
    return team.teamLeaders.map(tl => tl.user.name).join(', ');
  };

  // Check if current user can manage a specific team
  const canManageTeam = (team: TeamWithMembers): boolean => {
    if (currentUser?.role?.name === 'Admin/Manager') {
      return true;
    }
    
    if (currentUser?.role?.name === 'Team Leader') {
      // Team leaders can only manage teams they lead
      return team.teamLeaders.some(tl => tl.user.id === currentUser.id);
    }
    
    return false;
  };

  if (loading && teams.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading teams...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground">
            Manage teams and their members across your organization
          </p>
        </div>
        {canCreateTeams && (
          <Button onClick={onCreateTeam}>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadTeams}
              className="mt-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Teams ({total})
          </CardTitle>
          <CardDescription>
            {currentUser?.role?.name === 'Admin/Manager' 
              ? 'All teams in your organization'
              : 'Teams you have access to'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No teams found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'No teams match your search criteria.'
                  : 'There are no teams to display.'
                }
              </p>
              {canCreateTeams && !searchTerm && (
                <Button onClick={onCreateTeam}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Team
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Leaders</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div className="font-medium">{team.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-muted-foreground">
                        {team.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {team.members?.length || 0} members
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">
                          {getTeamLeaderNames(team)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(team.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canViewMembers && (
                            <DropdownMenuItem onClick={() => onViewMembers(team)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Members
                            </DropdownMenuItem>
                          )}
                          {canManageTeam(team) && (
                            <>
                              <DropdownMenuSeparator />
                              {canEditTeams && (
                                <DropdownMenuItem onClick={() => onEditTeam(team)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Team
                                </DropdownMenuItem>
                              )}
                              {canDeleteTeams && (
                                <DropdownMenuItem 
                                  onClick={() => onDeleteTeam(team)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Team
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total} teams
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}