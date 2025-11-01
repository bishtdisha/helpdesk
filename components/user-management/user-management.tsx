"use client"

import { useState } from 'react';
import { SafeUserWithRole } from '@/lib/types/rbac';
import { UserList } from './user-list';
import { UserForm } from './user-form';
import { RoleSelector } from './role-selector';
import { TeamSelector } from './team-selector';
import { UserProfile } from './user-profile';
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
  userForm: { isOpen: boolean; user?: SafeUserWithRole | null; mode: 'create' | 'edit' };
  roleSelector: { isOpen: boolean; user?: SafeUserWithRole };
  teamSelector: { isOpen: boolean; user?: SafeUserWithRole };
  userProfile: { isOpen: boolean; user?: SafeUserWithRole; mode: 'view' | 'edit' };
  deleteConfirm: { isOpen: boolean; user?: SafeUserWithRole };
};

export function UserManagement() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deletingUser, setDeletingUser] = useState(false);
  
  const [dialogs, setDialogs] = useState<DialogState>({
    userForm: { isOpen: false, user: null, mode: 'create' },
    roleSelector: { isOpen: false, user: undefined },
    teamSelector: { isOpen: false, user: undefined },
    userProfile: { isOpen: false, user: undefined, mode: 'view' },
    deleteConfirm: { isOpen: false, user: undefined },
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
      userForm: { isOpen: false, user: null, mode: 'create' },
      roleSelector: { isOpen: false, user: undefined },
      teamSelector: { isOpen: false, user: undefined },
      userProfile: { isOpen: false, user: undefined, mode: 'view' },
      deleteConfirm: { isOpen: false, user: undefined },
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
  
  // User List handlers
  const handleCreateUser = () => {
    updateDialog('userForm', { isOpen: true, user: null, mode: 'create' });
  };
  
  const handleEditUser = (user: SafeUserWithRole) => {
    updateDialog('userForm', { isOpen: true, user, mode: 'edit' });
  };
  
  const handleDeleteUser = (user: SafeUserWithRole) => {
    updateDialog('deleteConfirm', { isOpen: true, user });
  };
  
  const handleViewUser = (user: SafeUserWithRole) => {
    updateDialog('userProfile', { isOpen: true, user, mode: 'view' });
  };
  
  // Profile handlers
  const handleEditProfile = () => {
    updateDialog('userProfile', { mode: 'edit' });
  };
  
  // Role and Team assignment handlers
  const handleAssignRole = (user: SafeUserWithRole) => {
    updateDialog('roleSelector', { isOpen: true, user });
  };
  
  const handleAssignTeam = (user: SafeUserWithRole) => {
    updateDialog('teamSelector', { isOpen: true, user });
  };
  
  // Delete user confirmation
  const handleConfirmDelete = async () => {
    const user = dialogs.deleteConfirm.user;
    if (!user) return;
    
    setDeletingUser(true);
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      
      handleSuccess();
    } catch (error) {
      console.error('Failed to delete user:', error);
      // You might want to show a toast notification here
    } finally {
      setDeletingUser(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Main User List */}
      <UserList
        key={refreshTrigger} // Force re-render when data changes
        onCreateUser={handleCreateUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onViewUser={handleViewUser}
      />
      
      {/* User Form Dialog */}
      <UserForm
        user={dialogs.userForm.user}
        isOpen={dialogs.userForm.isOpen}
        onClose={() => updateDialog('userForm', { isOpen: false })}
        onSuccess={handleSuccess}
        mode={dialogs.userForm.mode}
      />
      
      {/* Role Selector Dialog */}
      {dialogs.roleSelector.user && (
        <RoleSelector
          user={dialogs.roleSelector.user}
          isOpen={dialogs.roleSelector.isOpen}
          onClose={() => updateDialog('roleSelector', { isOpen: false })}
          onSuccess={handleSuccess}
        />
      )}
      
      {/* Team Selector Dialog */}
      {dialogs.teamSelector.user && (
        <TeamSelector
          user={dialogs.teamSelector.user}
          isOpen={dialogs.teamSelector.isOpen}
          onClose={() => updateDialog('teamSelector', { isOpen: false })}
          onSuccess={handleSuccess}
        />
      )}
      
      {/* User Profile Dialog */}
      {dialogs.userProfile.user && (
        <UserProfile
          user={dialogs.userProfile.user}
          isOpen={dialogs.userProfile.isOpen}
          onClose={() => updateDialog('userProfile', { isOpen: false })}
          onSuccess={handleSuccess}
          mode={dialogs.userProfile.mode}
          onEditMode={handleEditProfile}
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
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{dialogs.deleteConfirm.user?.name}</strong>?
              This action cannot be undone and will permanently remove the user from the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-destructive text-sm">
              <strong>Warning:</strong> This will permanently delete:
            </p>
            <ul className="text-destructive text-sm mt-2 ml-4 list-disc">
              <li>User account and profile information</li>
              <li>All associated sessions</li>
              <li>Role and team assignments</li>
              <li>Audit log entries (will be preserved for compliance)</li>
            </ul>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => updateDialog('deleteConfirm', { isOpen: false })}
              disabled={deletingUser}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletingUser}
            >
              {deletingUser ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}