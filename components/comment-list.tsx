'use client';

import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Edit, Trash2, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/contexts/auth-context';
import { FormattedContent } from './formatted-content';
import { VirtualizedCommentList } from './virtualized-comment-list';
import { useVirtualScrolling } from '@/lib/performance/virtual-scrolling';

interface Comment {
  id: string;
  content: string;
  ticketId: string;
  authorId: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

interface CommentListProps {
  comments: Comment[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
}

export function CommentList({
  comments,
  isLoading = false,
  isError = false,
  error = null,
  onEdit,
  onDelete,
}: CommentListProps) {
  const { user } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error?.message || 'Failed to load comments. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (!comments || comments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check if user can edit/delete a comment
  const canModifyComment = (comment: Comment) => {
    return user?.id === comment.authorId;
  };

  // Check if we should use virtual scrolling
  const shouldUseVirtualScrolling = useVirtualScrolling(comments.length, 20);

  // Use virtual scrolling for large comment lists
  if (shouldUseVirtualScrolling) {
    return (
      <VirtualizedCommentList
        comments={comments}
        currentUserId={user?.id}
        canEditComment={canModifyComment}
        canDeleteComment={canModifyComment}
        onEditComment={onEdit}
        onDeleteComment={(comment) => onDelete?.(comment.id)}
      />
    );
  }

  // Regular rendering for smaller comment lists
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card
          key={comment.id}
          className={comment.isInternal ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20' : ''}
        >
          <CardContent className="pt-6">
            <div className="flex gap-3">
              {/* Author Avatar */}
              <Avatar className="h-10 w-10">
                <div className="bg-primary text-primary-foreground flex items-center justify-center h-full w-full text-sm font-medium">
                  {comment.author.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </Avatar>

              {/* Comment Content */}
              <div className="flex-1 space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), 'PPp')}
                      </span>
                      {comment.isInternal && (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-full">
                          <Lock className="h-3 w-3" />
                          Internal Note
                        </span>
                      )}
                      {comment.createdAt !== comment.updatedAt && (
                        <span className="text-xs text-muted-foreground italic">
                          (edited)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{comment.author.email}</p>
                  </div>

                  {/* Action Buttons */}
                  {canModifyComment(comment) && (
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(comment)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit comment</span>
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(comment.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete comment</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Comment Body */}
                <FormattedContent content={comment.content} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
