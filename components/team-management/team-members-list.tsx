"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { TeamWithMembers, SafeUserWithRole } from '@/lib/types/rbac';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Search, 
  MoreHorizontal, 
  UserMinus, 
  Eye,
  Crown,
  Loader2,
  Mail,
  Calendar,
  Shield,
  X,
} from 'lucide-react';

interface TeamMembersListProps {
  team: TeamWithMembers;
  isOpen: boolean;
  onClose: () => void;
  onRemoveMember?: (user: SafeUserWithRole) => void;
  onViewMember?: (user: SafeUserWithRole) => void;
}

interface TeamMembersResponse {
  team: {
    id: string;
    name: string;
  };
  members: SafeUserWithRole[];
  leaders: SafeUserWithRole[];
  total: number;
  page: number;
  limit: number;
}

export function TeamMembersList({ 
  team, 
  isOpen, 
  onClose, 
  onRemoveMember, 
  onViewMember 
}: TeamMembersListProps) {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<SafeUserWithRole[]>([]);
  const [leaders, setLeaders] = useState<SafeUserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Load team members
  const loadMembers = async () => {
    if (!isOpen || !team.id) return;
    
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
      
      const response = await fetch(`/api/teams/${team.id}/members?${params}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load team members');
      }
      
      const data: TeamMembersResponse = await response.json();
      setMembers(data.members);
      setLeaders(data.leaders || []);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members');
      setMembers([]);
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  };

  // Load members when dialog opens or dependencies change
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setSearchTerm('');
      loadMembers();
    }
  }, [isOpen, team.id]);

  useEffect(() => {
    loadMembers();
  }, [page, searchTerm]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  };

  // Check permissions
  const canViewMembers = currentUser?.role?.name === 'Admin/Manager' || 
                        currentUser?.role?.name === 'Team Leader';
  const canManageMembers = currentUser?.role?.name === 'Admin/Manager';
  
  // Check if current user is a leader of this team
  const isTeamLeader = currentUser?.role?.name === 'Team Leader' && 
                      leaders.some(leader => leader.id === currentUser.id);

  if (!canViewMembers) {
    return null;
  }

  // Get role badge variant
  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'Admin/Manager':
        return 'destructive';
      case 'Team Leader':
        return 'default';
      case 'User/Employee':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Check if user is a leader of this team
  const isUserTeamLeader = (user: SafeUserWithRole): boolean => {
    return leaders.some(leader => leader.id === user.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {team.name} - Team Members
          </DialogTitle>
          <DialogDescription>
            View and manage members of the {team.name} team
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search members..."
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
                  onClick={loadMembers}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Team Leaders Section */}
          {leaders.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Team Leaders ({leaders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {leaders.map((leader) => (
                    <div key={leader.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Crown className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{leader.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {leader.email}
                          </div>
                        </div>
                      </div>
                      <Badge variant={getRoleBadgeVariant(leader.role?.name || '')}>
                        {leader.role?.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members Table */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members ({total})
              </CardTitle>
              <CardDescription>
                All members assigned to this team
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {loading && members.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading members...
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No members found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? 'No members match your search criteria.'
                      : 'This team has no members assigned yet.'
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              {isUserTeamLeader(member) ? (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              ) : (
                                <Users className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {member.name}
                                {isUserTeamLeader(member) && (
                                  <Badge variant="outline" className="text-xs">
                                    Leader
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.role?.name || '')}>
                            <Shield className="w-3 h-3 mr-1" />
                            {member.role?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.isActive ? 'default' : 'secondary'}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(member.createdAt).toLocaleDateString()}
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
                              {onViewMember && (
                                <DropdownMenuItem onClick={() => onViewMember(member)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                              )}
                              {(canManageMembers || isTeamLeader) && onRemoveMember && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => onRemoveMember(member)}
                                    className="text-destructive"
                                  >
                                    <UserMinus className="w-4 h-4 mr-2" />
                                    Remove from Team
                                  </DropdownMenuItem>
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
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total} members
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

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}