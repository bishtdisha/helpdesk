'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, AlertCircle, UserPlus, Check } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/contexts/auth-context';
import { toast } from 'sonner';

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

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (userId: string) => Promise<void>;
  ticketId: string;
  existingFollowerIds: string[];
}

export function UserSearchDialog({
  open,
  onOpenChange,
  onSelectUser,
  ticketId,
  existingFollowerIds,
}: UserSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

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

      // Filter out users who are already followers
      const filteredUsers = response.users.filter(
        (user) => !existingFollowerIds.includes(user.id)
      );

      setUsers(filteredUsers);
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
  }, [existingFollowerIds]);

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
    }
  }, [open]);

  // Handle user selection
  const handleSelectUser = async (userId: string) => {
    setIsAdding(userId);
    try {
      await onSelectUser(userId);
      // Dialog will be closed by parent component on success
    } catch (err) {
      // Error is handled by parent component
      console.error('Failed to add user:', err);
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Follower</DialogTitle>
          <DialogDescription>
            Search for users to add as followers to this ticket. They will receive notifications about updates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
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

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
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
                  No users found matching "{searchQuery}"
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Try a different search term
                </p>
              </div>
            )}

            {/* User Results */}
            {!isLoading && !isError && users.length > 0 && (
              <div className="space-y-2">
                {users.map((user) => {
                  const isCurrentUser = user.id === currentUser?.id;
                  const isAlreadyFollower = existingFollowerIds.includes(user.id);
                  const isAddingThisUser = isAdding === user.id;

                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
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
                          {isCurrentUser && (
                            <span className="text-xs text-muted-foreground ml-2">(You)</span>
                          )}
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

                      {/* Add Button */}
                      {isAlreadyFollower ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Following
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSelectUser(user.id)}
                          disabled={isAddingThisUser || isAdding !== null}
                        >
                          {isAddingThisUser ? (
                            <>Adding...</>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Message */}
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="text-xs text-muted-foreground text-center">
              Type at least 2 characters to search
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
