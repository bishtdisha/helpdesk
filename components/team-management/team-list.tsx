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
import { cn } from '@/lib/utils';

interface TeamListProps {
  onCreateTeam: () => void;
  onEditTeam: (team: TeamWithMembers) => void;
  onDeleteTeam: (team: TeamWithMembers) => void;
  onViewMembers: (team: TeamWithMembers) => void;
  onViewTeamBoard?: (team: TeamWithMembers) => void;
}

export function TeamList({ onCreateTeam, onEditTeam, onDeleteTeam, onViewMembers, onViewTeamBoard }: TeamListProps) {
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
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 border border-blue-100 dark:border-blue-900">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Team Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage teams and their members across your organization
              </p>
            </div>
          </div>
          
          {canCreateTeams && (
            <Button onClick={onCreateTeam} size="lg" className="shadow-md">
              <Plus className="h-5 w-5 mr-2" />
              Create Team
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-300 border-l-3 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/30 dark:to-background">
          <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Total Teams</p>
                <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">{total}</p>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">All teams</p>
              </div>
              <div className="p-2 bg-blue-500/15 rounded-lg">
                <Users className="h-4 w-4 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-300 border-l-3 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/30 dark:to-background">
          <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Total Members</p>
                <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">{teams.reduce((sum, team) => sum + (team.members?.length || 0), 0)}</p>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Across all teams</p>
              </div>
              <div className="p-2 bg-purple-500/15 rounded-lg">
                <Users className="h-4 w-4 text-purple-700 dark:text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-300 border-l-3 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/30 dark:to-background">
          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Team Leaders</p>
                <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">{teams.reduce((sum, team) => sum + (team.teamLeaders?.length || 0), 0)}</p>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Managing teams</p>
              </div>
              <div className="p-2 bg-amber-500/15 rounded-lg">
                <Crown className="h-4 w-4 text-amber-700 dark:text-amber-300" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-300 border-l-3 border-l-green-500 bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/30 dark:to-background">
          <div className="absolute top-0 right-0 w-12 h-12 bg-green-500/10 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Avg Team Size</p>
                <p className="text-2xl font-extrabold text-green-700 dark:text-green-300">{teams.length > 0 ? Math.round(teams.reduce((sum, team) => sum + (team.members?.length || 0), 0) / teams.length) : 0}</p>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Members per team</p>
              </div>
              <div className="p-2 bg-green-500/15 rounded-lg">
                <UserCheck className="h-4 w-4 text-green-700 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded">
                <Search className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-base font-semibold">Search Teams</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams by name..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams Table */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Teams Directory</CardTitle>
              <CardDescription className="mt-1">
                {total > 0 ? `Showing ${teams.length} of ${total} teams` : 'No teams found'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

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

        <CardContent className="p-0">
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
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="font-semibold w-16">#</TableHead>
                  <TableHead className="font-semibold">Team Name</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold text-center">Members</TableHead>
                  <TableHead className="font-semibold text-center">Leaders</TableHead>
                  <TableHead className="font-semibold text-center">Open Tickets</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="text-center font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team, index) => {
                  // Check if current user leads this team
                  const isLeader = currentUser && team.teamLeaders?.some(tl => tl.user.id === currentUser.id);
                  const serialNumber = (page - 1) * limit + index + 1;
                  
                  return (
                    <TableRow 
                      key={team.id} 
                      className={cn(
                        "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors group",
                        isLeader ? 'bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40' : ''
                      )}
                      onClick={() => onViewTeamBoard && onViewTeamBoard(team)}
                    >
                      <TableCell>
                        <div className="text-sm font-medium text-muted-foreground">{serialNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{team.name}</div>
                          {isLeader && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              You lead
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-muted-foreground">
                          {team.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Badge 
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800 text-base font-semibold"
                          >
                            {team.members?.length || 0}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {(team.teamLeaders?.length || 0) > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {team.teamLeaders?.map((leader, index) => (
                                <Badge 
                                  key={leader.id} 
                                  variant="secondary"
                                  className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
                                >
                                  {leader.user.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No leaders</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Badge 
                            variant="secondary"
                            className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800 text-base font-semibold"
                          >
                            {team._count?.tickets || 0}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(team.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onViewTeamBoard && onViewTeamBoard(team)}
                          className="hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    </TableRow>
                  );
                })}
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