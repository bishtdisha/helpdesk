'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface ResetConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  currentPreset?: string;
  widgetCount: number;
}

export function ResetConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  currentPreset,
  widgetCount,
}: ResetConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Reset Dashboard to Default?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This action will reset your dashboard to the default layout and remove all customizations.
            </p>
            <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
              <p className="font-medium">This will:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Clear your current widget layout and positions</li>
                <li>Reset widget visibility settings</li>
                {currentPreset && (
                  <li>Remove the current preset: &quot;{currentPreset}&quot;</li>
                )}
                <li>Restore the default layout for your role</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              You currently have {widgetCount} widgets configured. This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}