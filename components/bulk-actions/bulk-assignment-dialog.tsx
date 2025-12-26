'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Search, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  name: string;
  email: string;
  role?: {
    id: string;
    name: string;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
}

interface BulkAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (userId: string) => Promise<void>;
  isProcessing: boolean;
  progress?: {
    current: number;
    total: number;
    successCount: number;
    failureCount: number;
  };
}

export function BulkAssignmentDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isProcessing,
  progress,
}: BulkAssignmentDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Debounced search function
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    try {
      const response = await apiClient.get<{
        users: User[];
        total: number;
      }>('/users', {
        search: query.trim(),
        limit: 20,
        isActive: true,
      });

      setUsers(response.users);
    } catch (err) {
      console.error('Error searching users:', err);
      setIsError(true);
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to search users'
      );
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setUsers([]);
      setIsError(false);
      setErrorMessage('');
      setSelectedUserId(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (selectedUserId) {
      await onConfirm(selectedUserId);
    }
  };

  const progressPercentage = progress
    ? (progress.current / progress.total) * 100
    : 0;

  const isComplete = progress && progress.current === progress.total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Tickets</DialogTitle>
          <DialogDescription>
            Select a user to assign {selectedCount} {selectedCount === 1 ? 'ticket' : 'tickets'} to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          {!isProcessing && !isComplete && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          )}

          {/* User Results */}
          {!isProcessing && !isComplete && (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {/* Loading State */}
              {isLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              {/* Empty State - No Search */}
              {!isLoading && !isError && searchQuery.length === 0 && (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Start typing to search for users
                  </p>
                </div>
              )}

              {/* Empty State - No Results */}
              {!isLoading && !isError && searchQuery.length >= 2 && users.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No users found matching &quot;{searchQuery}&quot;
                  </p>
                </div>
              )}

              {/* User List */}
              {!isLoading && !isError && users.length > 0 && (
                <div className="space-y-2">
                  {users.map((user) => {
                    const isSelected = selectedUserId === user.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                          isSelected
                            ? 'bg-primary/10 border-primary'
                            : 'bg-card hover:bg-primary/10'
                        }`}
                      >
                        {/* Avatar */}
                        <Avatar className="h-10 w-10">
                          <div className="bg-primary text-primary-foreground flex items-center justify-center h-full w-full text-sm font-medium">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        </Avatar>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.name}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                            {user.role && (
                              <Badge variant="outline" className="text-xs">
                                {user.role.name}
                              </Badge>
                            )}
                            {user.team && (
                              <Badge variant="secondary" className="text-xs">
                                {user.team.name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Progress Indicator */}
          {isProcessing && progress && (
            <div className="space-y-3">
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Assigning {progress.current} of {progress.total}...
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
                    {progress.successCount} {progress.successCount === 1 ? 'ticket' : 'tickets'} assigned successfully
                  </span>
                </div>
              )}
              {progress.failureCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <XCircle className="h-4 w-4" />
                  <span>
                    {progress.failureCount} {progress.failureCount === 1 ? 'ticket' : 'tickets'} failed to assign
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
              <Button
                onClick={handleConfirm}
                disabled={!selectedUserId}
              >
                Assign
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
