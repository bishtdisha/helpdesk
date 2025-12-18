'use client';

import { useMemo, useCallback } from 'react';
import { VirtualList, useVirtualScrolling } from '@/lib/performance/virtual-scrolling';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormattedContent } from './formatted-content';
import { format } from 'date-fns';
import { Edit, Trash2, Lock } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface VirtualizedCommentListProps {
  comments: Comment[];
  currentUserId?: string;
  canEditComment?: (comment: Comment) => boolean;
  canDeleteComment?: (comment: Comment) => boolean;
  onEditComment?: (comment: Comment) => void;
  onDeleteComment?: (comment: Comment) => void;
  className?: string;
}

export function VirtualizedCommentList({
  comments,
  currentUserId,
  canEditComment,
  canDeleteComment,
  onEditComment,
  onDeleteComment,
  className,
}: VirtualizedCommentListProps) {
  const shouldUseVirtualScrolling = useVirtualScrolling(comments.length, 20);

  // Memoized comment renderer
  const renderComment = useCallback((comment: Comment, index: number) => {
    const isOwnComment = currentUserId === comment.author.id;
    const canEdit = canEditComment?.(comment) || isOwnComment;
    const canDelete = canDeleteComment?.(comment) || isOwnComment;

    return (
      <div className="flex gap-3 p-4 border-b last:border-b-0">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.author.avatar} />
          <AvatarFallback className="text-sm">
            {comment.author.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">{comment.author.name}</span>
            
            {comment.isInternal && (
              <Badge variant="secondary" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Internal
              </Badge>
            )}
            
            <span className="text-xs text-muted-foreground">
              {format(new Date(comment.createdAt), 'MMM dd, yyyy h:mm a')}
            </span>
            
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>
          
          <div className="prose prose-sm max-w-none">
            <FormattedContent content={comment.content} />
          </div>
          
          {(canEdit || canDelete) && (
            <div className="flex gap-2 mt-3">
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditComment?.(comment)}
                  className="h-7 px-2 text-xs"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteComment?.(comment)}
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [currentUserId, canEditComment, canDeleteComment, onEditComment, onDeleteComment]);

  // Memoized item key function
  const getItemKey = useCallback((comment: Comment, index: number) => comment.id, []);

  // If we don't need virtual scrolling, render normally
  if (!shouldUseVirtualScrolling) {
    return (
      <div className={className}>
        {comments.map((comment, index) => (
          <div key={comment.id}>
            {renderComment(comment, index)}
          </div>
        ))}
      </div>
    );
  }

  // Use virtual scrolling for large comment lists
  return (
    <VirtualList
      items={comments}
      renderItem={renderComment}
      itemHeight={120} // Estimated height per comment
      containerHeight={400}
      className={className}
      getItemKey={getItemKey}
      emptyMessage="No comments yet"
    />
  );
}

// Hook to calculate dynamic comment height based on content
export function useCommentHeight(comment: Comment) {
  return useMemo(() => {
    // Base height for avatar, name, date, and padding
    let height = 80;
    
    // Add height based on content length (rough estimation)
    const contentLines = Math.ceil(comment.content.length / 80);
    height += contentLines * 20;
    
    // Add height for internal badge
    if (comment.isInternal) {
      height += 20;
    }
    
    // Add height for action buttons
    height += 30;
    
    return Math.max(height, 100); // Minimum height
  }, [comment]);
}

// Performance optimized comment list with dynamic heights
export function DynamicVirtualizedCommentList({
  comments,
  ...props
}: VirtualizedCommentListProps) {
  const shouldUseVirtualScrolling = useVirtualScrolling(comments.length, 20);
  
  // Calculate dynamic heights for each comment
  const itemSizes = useMemo(() => {
    return comments.map(comment => {
      // Base height calculation
      let height = 80;
      const contentLines = Math.ceil(comment.content.length / 80);
      height += contentLines * 20;
      if (comment.isInternal) height += 20;
      height += 30;
      return Math.max(height, 100);
    });
  }, [comments]);

  if (!shouldUseVirtualScrolling) {
    return <VirtualizedCommentList comments={comments} {...props} />;
  }

  // For now, use fixed height virtual scrolling
  // Dynamic height virtual scrolling would require more complex implementation
  return <VirtualizedCommentList comments={comments} {...props} />;
}