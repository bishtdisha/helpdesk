"use client"

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleSelect } from '@/components/performance/simple-select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface QuickTicketCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  teamName: string;
  defaultStatus?: string;
}

export function QuickTicketCreateDialog({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  teamName,
  defaultStatus,
}: QuickTicketCreateDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determine if user is Team Leader or Employee
  const isTeamLeaderOrEmployee = user?.role?.name === 'Team Leader' || user?.role?.name === 'User/Employee';
  
  // Form state
  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState(isTeamLeaderOrEmployee ? user?.id || '' : '');
  const [assignedTo, setAssignedTo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a ticket title');
      return;
    }
    
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: title.trim(), // Use title as description for quick create
          customerId,
          teamId,
          assignedTo: assignedTo || undefined,
          status: defaultStatus || 'OPEN',
          priority: 'MEDIUM',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create ticket');
      }

      const data = await response.json();
      
      toast.success('Ticket created successfully', {
        description: `Ticket #${data.ticket?.ticketNumber || 'N/A'} has been created.`,
      });

      // Reset form
      setTitle('');
      setCustomerId(isTeamLeaderOrEmployee ? user?.id || '' : '');
      setAssignedTo('');
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Ticket - {teamName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticket Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Ticket Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Product arrived damaged"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Customer */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            {isTeamLeaderOrEmployee ? (
              <Input
                id="customer"
                value={user?.name || ''}
                disabled={true}
                className="bg-muted cursor-not-allowed"
              />
            ) : (
              <SimpleSelect
                endpoint="/api/users?simple=true&limit=200"
                value={customerId}
                onValueChange={setCustomerId}
                placeholder="Select customer..."
                disabled={isSubmitting}
                responseKey="users"
                labelKey="name"
                valueKey="id"
                searchPlaceholder="Search users..."
              />
            )}
            {isTeamLeaderOrEmployee && (
              <p className="text-xs text-muted-foreground">
                Automatically set to your account
              </p>
            )}
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <SimpleSelect
              endpoint="/api/users?simple=true&limit=200&forAssignment=true"
              value={assignedTo}
              onValueChange={setAssignedTo}
              placeholder="Assign to a user (optional)..."
              disabled={isSubmitting}
              responseKey="users"
              labelKey="name"
              valueKey="id"
              searchPlaceholder="Search users..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
