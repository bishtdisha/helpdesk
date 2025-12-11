'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CustomSLADialogProps {
  ticketId: string;
  currentSlaDueAt?: Date | null;
  customSlaDueAt?: Date | null;
  onUpdate?: () => void;
  trigger?: React.ReactNode;
}

export function CustomSLADialog({
  ticketId,
  currentSlaDueAt,
  customSlaDueAt,
  onUpdate,
  trigger,
}: CustomSLADialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customDate, setCustomDate] = useState(
    customSlaDueAt ? format(new Date(customSlaDueAt), "yyyy-MM-dd'T'HH:mm") : ''
  );

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/tickets/${ticketId}/custom-sla`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customSlaDueAt: customDate || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update SLA');
      }

      const data = await response.json();
      toast.success(data.message || 'SLA updated successfully');
      setOpen(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating custom SLA:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update SLA');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setCustomDate('');
    try {
      setLoading(true);

      const response = await fetch(`/api/tickets/${ticketId}/custom-sla`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customSlaDueAt: null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset SLA');
      }

      toast.success('SLA reset to default');
      setOpen(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error resetting SLA:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset SLA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Set Custom SLA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Custom SLA Deadline</DialogTitle>
          <DialogDescription>
            Set a custom SLA deadline for this ticket only. This will override the default SLA policy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentSlaDueAt && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Default SLA:</span>
                <span>{format(new Date(currentSlaDueAt), 'PPp')}</span>
              </div>
            </div>
          )}

          {customSlaDueAt && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Current Custom SLA:</span>
                <span>{format(new Date(customSlaDueAt), 'PPp')}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="custom-sla">New Custom SLA Deadline</Label>
            <Input
              id="custom-sla"
              type="datetime-local"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default SLA policy
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {customSlaDueAt && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              Reset to Default
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Custom SLA'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
