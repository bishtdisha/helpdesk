"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Role, SafeUserWithRole } from '@/lib/types/rbac';
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
import { Loader2, UserCheck, X, Shield } from 'lucide-react';

interface RoleSelectorProps {
  user: SafeUserWithRole;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RoleSelector({ user, isOpen, onClose, onSuccess }: RoleSelectorProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Load available roles
  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };
  
  // Initialize selected role when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRoleId(user.roleId || '');
      setError(null);
      loadRoles();
    }
  }, [isOpen, user.roleId]);
  
  // Handle role assignment
  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      setError('Please select a role');
      return;
    }
    
    if (selectedRoleId === user.roleId) {
      onClose();
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/${user.id}/assign-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          roleId: selectedRoleId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign role');
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setLoading(false);
    }
  };
  
  // Get role description
  const getRoleDescription = (roleName: string) => {
    switch (roleName) {
      case 'Admin/Manager':
        return 'Full system access with organization-wide management capabilities';
      case 'Team Leader':
        return 'Team management and oversight permissions within assigned teams';
      case 'User/Employee':
        return 'Basic operational access with limited permissions';
      default:
        return 'Custom role with specific permissions';
    }
  };
  
  // Get role badge variant
  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'Admin/Manager':
        return 'default';
      case 'Team Leader':
        return 'secondary';
      case 'User/Employee':
        return 'outline';
      default:
        return 'outline';
    }
  };
  
  // Check if current user can assign roles
  const canAssignRoles = currentUser?.role?.name === 'Admin/Manager';
  
  if (!canAssignRoles) {
    return null;
  }
  
  const selectedRole = roles.find(role => role.id === selectedRoleId);
  const currentRole = roles.find(role => role.id === user.roleId);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Assign Role
          </DialogTitle>
          <DialogDescription>
            Change the role for <strong>{user.name}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Role */}
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="p-3 bg-muted rounded-md">
              {currentRole ? (
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant={getRoleBadgeVariant(currentRole.name)}>
                      {currentRole.name}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getRoleDescription(currentRole.name)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No role assigned</p>
              )}
            </div>
          </div>
          
          {/* New Role Selection */}
          <div className="space-y-2">
            <Label>New Role *</Label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(role.name)} className="text-xs">
                        {role.name}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Selected role description */}
            {selectedRole && (
              <div className="p-3 bg-primary/10 rounded-md">
                <p className="text-sm text-muted-foreground">
                  {getRoleDescription(selectedRole.name)}
                </p>
              </div>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
          
          {/* Warning for role changes */}
          {selectedRoleId && selectedRoleId !== user.roleId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-yellow-800 text-sm">
                <strong>Warning:</strong> Changing the user's role will immediately affect their 
                permissions and access to system features. The user may need to log in again 
                for changes to take full effect.
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
            onClick={handleAssignRole} 
            disabled={loading || !selectedRoleId}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4 mr-2" />
            )}
            Assign Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}