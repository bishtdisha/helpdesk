"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Team, SafeUserWithRole } from '@/lib/types/rbac';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Users, UserPlus, UserMinus, X, ArrowRight } from 'lucide-react';

interface TeamAssignmentProps {
  user: SafeUserWithRole;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TeamAssignment({ user, isOpen, onClose, onSuccess }: TeamAssignmentProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Load available teams
  const loadTeams = async () => {
    try {
      const response = await fetch('/api/teams', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    }
  };
  
  // Initialize selected team when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTeamId(user.teamId || '');
      setError(null);
      loadTeams();
    }
  }, [isOpen, user.teamId]);
  
  // Handle team assignment
  const handleAssignTeam = async () => {
    if (selectedTeamId === user.teamId) {
      onClose();
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let response: Response;
      
      if (selectedTeamId) {
        // Assign to team
        response = await fetch(`/api/users/${user.id}/assign-team`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            teamId: selectedTeamId,
          }),
        });
      } else {
        // Remove from current team
        response = await fetch(`/api/users/${user.id}/assign-team`, {
          method: 'DELETE',
          credentials: 'include',
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update team assignment');
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team assignment');
    } finally {
      setLoading(false);
    }
  };
  
  // Check if current user can assign teams
  const canAssignTeams = currentUser?.role?.name === 'Admin/Manager' || 
                        currentUser?.role?.name === 'Team Leader';
  
  if (!canAssignTeams) {
    return null;
  }
  
  const selectedTeam = teams.find(team => team.id === selectedTeamId);
  const currentTeam = teams.find(team => team.id === user.teamId);
  const isRemoving = !selectedTeamId && user.teamId;
  const isAssigning = selectedTeamId && selectedTeamId !== user.teamId;
  const hasChanges = selectedTeamId !== user.teamId;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Assignment
          </DialogTitle>
          <DialogDescription>
            Manage team assignment for <strong>{user.name}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Name:</span>
                <span className="text-sm">{user.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Role:</span>
                <Badge variant="secondary">{user.role?.name}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Current Team */}
          <div className="space-y-2">
            <Label>Current Team</Label>
            <Card>
              <CardContent className="pt-4">
                {currentTeam ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">{currentTeam.name}</Badge>
                      {currentTeam.description && (
                        <p className="text-sm text-muted-foreground">
                          {currentTeam.description}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No team assigned</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* New Team Selection */}
          <div className="space-y-2">
            <Label>New Team Assignment</Label>
            <Select
              value={selectedTeamId}
              onValueChange={setSelectedTeamId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team (or leave empty to remove)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <span className="text-muted-foreground">No team</span>
                </SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {team.name}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Selected team description */}
            {selectedTeam && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{selectedTeam.name}</Badge>
                  </div>
                  {selectedTeam.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedTeam.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Assignment Preview */}
          {hasChanges && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Assignment Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>From:</span>
                    <Badge variant="outline" className="text-xs">
                      {currentTeam?.name || 'No team'}
                    </Badge>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <span>To:</span>
                    <Badge variant="secondary" className="text-xs">
                      {selectedTeam?.name || 'No team'}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                  {isRemoving && (
                    <strong>Action:</strong> Remove user from {currentTeam?.name}
                  )}
                  {isAssigning && (
                    <strong>Action:</strong> {currentTeam ? 'Move' : 'Assign'} user 
                    {currentTeam && ` from ${currentTeam.name}`} to {selectedTeam?.name}
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Error message */}
          {error && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-4">
                <p className="text-destructive text-sm">{error}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Team Leader permissions note */}
          {currentUser?.role?.name === 'Team Leader' && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> As a Team Leader, you can only assign users to teams 
                  you have access to manage.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleAssignTeam} 
            disabled={loading || !hasChanges}
            variant={isRemoving ? "destructive" : "default"}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isRemoving ? (
              <UserMinus className="w-4 h-4 mr-2" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            {loading 
              ? 'Updating...'
              : isRemoving 
                ? 'Remove from Team' 
                : isAssigning
                  ? 'Assign to Team'
                  : 'No Changes'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}