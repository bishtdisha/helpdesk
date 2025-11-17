'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface BulkActionConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  selectedCount: number;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
  progress?: {
    current: number;
    total: number;
    successCount: number;
    failureCount: number;
  };
  warningMessage?: string;
}

export function BulkActionConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  selectedCount,
  onConfirm,
  isProcessing,
  progress,
  warningMessage,
}: BulkActionConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const progressPercentage = progress
    ? (progress.current / progress.total) * 100
    : 0;

  const isComplete = progress && progress.current === progress.total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Message */}
          {warningMessage && !isProcessing && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{warningMessage}</AlertDescription>
            </Alert>
          )}

          {/* Selected Count */}
          {!isProcessing && !isComplete && (
            <div className="text-sm text-muted-foreground">
              This action will affect{' '}
              <span className="font-semibold text-foreground">
                {selectedCount}
              </span>{' '}
              {selectedCount === 1 ? 'ticket' : 'tickets'}.
            </div>
          )}

          {/* Progress Indicator */}
          {isProcessing && progress && (
            <div className="space-y-3">
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Processing {progress.current} of {progress.total}...
                </span>
                <span className="font-medium">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            </div>
          )}

          {/* Results */}
          {isComplete && progress && (
            <div className="space-y-2">
              {progress.successCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    {progress.successCount} {progress.successCount === 1 ? 'ticket' : 'tickets'} updated successfully
                  </span>
                </div>
              )}
              {progress.failureCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <XCircle className="h-4 w-4" />
                  <span>
                    {progress.failureCount} {progress.failureCount === 1 ? 'ticket' : 'tickets'} failed to update
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!isProcessing && !isComplete && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirm}>
                Confirm
              </Button>
            </>
          )}
          {isComplete && (
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
