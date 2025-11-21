'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  UserPlus, 
  X,
  Users
} from 'lucide-react';
import { useFollowers } from '@/lib/hooks/use-followers';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useAuth } from '@/lib/contexts/auth-context';
import { UserSearchDialog } from './user-search-dialog';

interface FollowerManagerProps {
  ticketId: string;
}

export function FollowerManager({ ticketId }: FollowerManagerProps) {
  const { followers, isLoading, isError, error, addFollower, removeFollower, refresh } = useFollowers(ticketId);
  const permissions = usePermissions();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Check if user can add/remove followers
  const canManageFollowers = permissions.hasRole('Admin_Manager') || permissions.hasRole('Team_Leader');

  // Handle adding a follower
  const handleAddFollower = async (userId: string) => {
    try {
      await addFollower(userId);
      setIsAddDialogOpen(false);
    } catch (err) {
      // Error is already handled by the hook with toast
      console.error('Failed to add follower:', err);
    }
  };

  // Handle removing a follower
  const handleRemoveFollower = async (userId: string) => {
    setIsRemoving(userId);
    try {
      await removeFollower(userId);
    } catch (err) {
      // Error is already handled by the hook with toast
      console.error('Failed to remove follower:', err);
    } finally {
      setIsRemoving(null);
    }
  };

  // Check if current user can remove a specific follower
  const canRemoveFollower = (followerId: string): boolean => {
    if (canManageFollowers) return true;
    // Users can remove themselves
    return user?.id === followerId;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Followers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Followers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message || 'Failed to load followers. Please try again.'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refresh()} className="mt-4" variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Followers
              <Badge variant="secondary" className="ml-2">
                {followers.length}
              </Badge>
            </CardTitle>
            {canManageFollowers && (
              <Button 
                onClick={() => setIsAddDialogOpen(true)} 
                size="sm"
                variant="outline"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Follower
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {followers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No followers yet. Add team members to keep them updated on this ticket.
              </p>
              {canManageFollowers && (
                <Button 
                  onClick={() => setIsAddDialogOpen(true)} 
                  className="mt-4"
                  variant="outline"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Follower
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {followers.map((follower) => (
                <div
                  key={follower.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-primary/10 transition-colors"
                >
                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <div className="bg-primary text-primary-foreground flex items-center justify-center h-full w-full text-sm font-medium">
                      {follower.user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {follower.user.name}
                      {follower.userId === user?.id && (
                        <span className="text-xs text-muted-foreground ml-2">(You)</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-muted-foreground truncate">
                        {follower.user.email}
                      </p>
                      {follower.user.role && (
                        <Badge variant="outline" className="text-xs">
                          {follower.user.role.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  {canRemoveFollower(follower.userId) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFollower(follower.userId)}
                      disabled={isRemoving === follower.userId}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove follower</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Search Dialog */}
      <UserSearchDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSelectUser={handleAddFollower}
        ticketId={ticketId}
        existingFollowerIds={followers.map(f => f.userId)}
      />
    </>
  );
}
