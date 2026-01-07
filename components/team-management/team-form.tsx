"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { TeamWithMembers, CreateTeamData, UpdateTeamData } from '@/lib/types/rbac';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Users, Save, X } from 'lucide-react';

interface TeamFormProps {
  team?: TeamWithMembers | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
}

export function TeamForm({ team, isOpen, onClose, onSuccess, mode }: TeamFormProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Initialize form data when dialog opens or team changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && team) {
        setFormData({
          name: team.name || '',
          description: team.description || '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
        });
      }
      setError(null);
    }
  }, [isOpen, team, mode]);

  // Check permissions - only Admin/Manager can create/edit teams
  const canManageTeams = currentUser?.role?.name === 'Admin/Manager';

  if (!canManageTeams) {
    return null;
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response: Response;
      
      if (mode === 'create') {
        const createData: CreateTeamData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        };
        
        response = await fetch('/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(createData),
        });
      } else {
        const updateData: UpdateTeamData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        };
        
        response = await fetch(`/api/teams/${team?.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updateData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${mode} team`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} team`);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const isFormValid = formData.name.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {mode === 'create' ? 'Create New Team' : 'Edit Team'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new team to organize users in your organization.'
              : `Update the details for ${team?.name}.`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Team Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter team name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter team description (optional)"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Admin note */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              <strong>Note:</strong> After creating the team, you can assign team leaders 
              and members through the user management interface.
            </p>
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
              type="submit" 
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {mode === 'create' ? 'Create Team' : 'Update Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}