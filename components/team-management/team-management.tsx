"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeamWithMembers, SafeUserWithRole } from '@/lib/types/rbac';
import { TeamList } from './team-list';
import { TeamForm } from './team-form';
import { TeamMembersList } from './team-members-list';
import { TeamAssignment } from './team-assignment';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, AlertTriangle } from 'lucide-react';

type DialogState = {
  teamForm: { isOpen: boolean; team?: TeamWithMembers | null; mode: 'create' | 'edit' };
  teamMembers: { isOpen: boolean; team?: TeamWithMembers };
  teamAssignment: { isOpen: boolean; user?: SafeUserWithRole };
  deleteConfirm: { isOpen: boolean; team?: TeamWithMembers };
};

export function TeamManagement() {
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deletingTeam, setDeletingTeam] = useState(false);
  
  const [dialogs, setDialogs] = useState<DialogState>({
    teamForm: { isOpen: false, team: null, mode: 'create' },
    teamMembers: { isOpen: false, team: undefined },
    teamAssignment: { isOpen: false, user: undefined },
    deleteConfirm: { isOpen: false, team: undefined },
  });
  
  // Helper function to update dialog state
  const updateDialog = <K extends keyof DialogState>(
    key: K,
    updates: Partial<DialogState[K]>
  ) => {
    setDialogs(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }));
  };
  
  // Close all dialogs
  const closeAllDialogs = () => {
    setDialogs({
      teamForm: { isOpen: false, team: null, mode: 'create' },
      teamMembers: { isOpen: false, team: undefined },
      teamAssignment: { isOpen: false, user: undefined },
      deleteConfirm: { isOpen: false, team: undefined },
    });
  };
  
  // Refresh data
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle success actions
  const handleSuccess = () => {
    refreshData();
    closeAllDialogs();
  };
  
  // Team List handlers
  const handleCreateTeam = () => {
    updateDialog('teamForm', { isOpen: true, team: null, mode: 'create' });
  };
  
  const handleEditTeam = (team: TeamWithMembers) => {
    updateDialog('teamForm', { isOpen: true, team, mode: 'edit' });
  };
  
  const handleDeleteTeam = (team: TeamWithMembers) => {
    updateDialog('deleteConfirm', { isOpen: true, team });
  };
  
  const handleViewMembers = (team: TeamWithMembers) => {
    updateDialog('teamMembers', { isOpen: true, team });
  };

  const handleViewTeamBoard = (team: TeamWithMembers) => {
    // Use Next.js router for client-side navigation (no page reload)
    router.push(`/helpdesk/teams/${team.id}`);
  };
  
  // Team Members handlers
  const handleRemoveMember = (user: SafeUserWithRole) => {
    // Open team assignment dialog to remove user from team
    updateDialog('teamAssignment', { isOpen: true, user });
  };
  
  const handleViewMember = (user: SafeUserWithRole) => {
    // This could open a user profile dialog if needed
    console.log('View member:', user);
  };
  
  // Delete team confirmation
  const handleConfirmDelete = async () => {
    const team = dialogs.deleteConfirm.team;
    if (!team) return;
    
    setDeletingTeam(true);
    
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete team');
      }
      
      handleSuccess();
    } catch (error) {
      console.error('Failed to delete team:', error);
      // You might want to show a toast notification here
    } finally {
      setDeletingTeam(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Main Team List */}
      <TeamList
        key={refreshTrigger} // Force re-render when data changes
        onCreateTeam={handleCreateTeam}
        onEditTeam={handleEditTeam}
        onDeleteTeam={handleDeleteTeam}
        onViewMembers={handleViewMembers}
        onViewTeamBoard={handleViewTeamBoard}
      />
      
      {/* Team Form Dialog */}
      <TeamForm
        team={dialogs.teamForm.team}
        isOpen={dialogs.teamForm.isOpen}
        onClose={() => updateDialog('teamForm', { isOpen: false })}
        onSuccess={handleSuccess}
        mode={dialogs.teamForm.mode}
      />
      
      {/* Team Members Dialog */}
      {dialogs.teamMembers.team && (
        <TeamMembersList
          team={dialogs.teamMembers.team}
          isOpen={dialogs.teamMembers.isOpen}
          onClose={() => updateDialog('teamMembers', { isOpen: false })}
          onRemoveMember={handleRemoveMember}
          onViewMember={handleViewMember}
        />
      )}
      
      {/* Team Assignment Dialog */}
      {dialogs.teamAssignment.user && (
        <TeamAssignment
          user={dialogs.teamAssignment.user}
          isOpen={dialogs.teamAssignment.isOpen}
          onClose={() => updateDialog('teamAssignment', { isOpen: false })}
          onSuccess={() => {
            refreshData();
            // Keep the team members dialog open if it was open
            updateDialog('teamAssignment', { isOpen: false });
          }}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={dialogs.deleteConfirm.isOpen} 
        onOpenChange={(open) => updateDialog('deleteConfirm', { isOpen: open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Team
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{dialogs.deleteConfirm.team?.name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-destructive text-sm">
              <strong>Warning:</strong> This will permanently delete:
            </p>
            <ul className="text-destructive text-sm mt-2 ml-4 list-disc">
              <li>Team information and settings</li>
              <li>Team leader assignments</li>
              <li>All team-related audit logs will be preserved for compliance</li>
            </ul>
            <p className="text-destructive text-sm mt-2">
              <strong>Note:</strong> Team members will be unassigned from this team but their accounts will remain active.
            </p>
          </div>
          
          {/* Show member count warning if team has members */}
          {dialogs.deleteConfirm.team && dialogs.deleteConfirm.team.members && dialogs.deleteConfirm.team.members.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-yellow-800 text-sm">
                <strong>Important:</strong> This team has {dialogs.deleteConfirm.team.members.length} member(s). 
                They will be automatically unassigned from this team when it's deleted.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => updateDialog('deleteConfirm', { isOpen: false })}
              disabled={deletingTeam}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletingTeam}
            >
              {deletingTeam ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Team
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}