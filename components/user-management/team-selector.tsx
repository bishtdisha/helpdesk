"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Team, SafeUserWithRole } from '@/lib/types/rbac';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Users, X, UserPlus, UserMinus } from 'lucide-react';

interface TeamSelectorProps {
  user: SafeUserWithRole;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TeamSelector({ user, isOpen, onClose, onSuccess }: TeamSelectorProps) {
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Assignment
          </DialogTitle>
          <DialogDescription>
            Change the team assignment for <strong>{user.name}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Team */}
          <div className="space-y-2">
            <Label>Current Team</Label>
            <div className="p-3 bg-muted rounded-md">
              {currentTeam ? (
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="secondary">{currentTeam.name}</Badge>
                    {currentTeam.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentTeam.description}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No team assigned</p>
              )}
            </div>
          </div>
          
          {/* New Team Selection */}
          <div className="space-y-2">
            <Label>New Team</Label>
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
              <div className="p-3 bg-primary/10 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary">{selectedTeam.name}</Badge>
                </div>
                {selectedTeam.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedTeam.description}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
          
          {/* Action summary */}
          {(isAssigning || isRemoving) && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-blue-800 text-sm">
                {isRemoving && (
                  <>
                    <strong>Action:</strong> Remove user from {currentTeam?.name}
                  </>
                )}
                {isAssigning && (
                  <>
                    <strong>Action:</strong> {currentTeam ? 'Move' : 'Assign'} user 
                    {currentTeam && ` from ${currentTeam.name}`} to {selectedTeam?.name}
                  </>
                )}
              </p>
            </div>
          )}
          
          {/* Team Leader permissions note */}
          {currentUser?.role?.name === 'Team Leader' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> As a Team Leader, you can only assign users to teams 
                you have access to manage.
              </p>
            </div>
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
            disabled={loading}
            variant={isRemoving ? "destructive" : "default"}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isRemoving ? (
              <UserMinus className="w-4 h-4 mr-2" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            {isRemoving ? 'Remove from Team' : 'Assign to Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}