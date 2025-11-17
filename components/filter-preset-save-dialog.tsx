'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface FilterPresetSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

export function FilterPresetSaveDialog({
  open,
  onOpenChange,
  onSave,
}: FilterPresetSaveDialogProps) {
  const [presetName, setPresetName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    setIsSubmitting(true);
    try {
      onSave(presetName.trim());
      toast.success('Filter preset saved successfully');
      setPresetName('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save filter preset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPresetName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Filter Preset</DialogTitle>
          <DialogDescription>
            Give your filter preset a name so you can quickly apply it later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              placeholder="e.g., High Priority Open Tickets"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !presetName.trim()}
          >
            {isSubmitting ? 'Saving...' : 'Save Preset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
