'use client';

import { useState } from 'react';
import { CommentList } from './comment-list';
import { CommentEditor } from './comment-editor';
import { useComments } from '@/lib/hooks/use-comments';
import { useCommentMutations } from '@/lib/hooks/use-comment-mutations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

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

interface TicketCommentsProps {
  ticketId: string;
}

export function TicketComments({ ticketId }: TicketCommentsProps) {
  const { comments, isLoading, isError, error, refresh } = useComments(ticketId);
  const { addComment, updateComment, deleteComment } = useCommentMutations(ticketId);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Handle new comment submission
  const handleSubmit = async (content: string, isInternal: boolean) => {
    setIsSubmitting(true);
    try {
      await addComment({ content, isInternal });
      toast.success('Comment posted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to post comment');
      throw err; // Re-throw to prevent editor from clearing
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment edit submission
  const handleEditSubmit = async (content: string, isInternal: boolean) => {
    if (!editingComment) return;
    
    setIsSubmitting(true);
    try {
      await updateComment(editingComment.id, { content });
      toast.success('Comment updated successfully');
      setEditingComment(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update comment');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment deletion
  const handleDelete = async () => {
    if (!deletingCommentId) return;
    
    try {
      await deleteComment(deletingCommentId);
      toast.success('Comment deleted successfully');
      setDeletingCommentId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  // Handle edit button click
  const handleEditClick = (comment: Comment) => {
    setEditingComment(comment);
  };

  // Handle delete button click
  const handleDeleteClick = (commentId: string) => {
    setDeletingCommentId(commentId);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingComment(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
          {!isLoading && comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment List */}
        <CommentList
          comments={comments}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />

        {/* Edit Mode */}
        {editingComment && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Edit Comment</h3>
            <CommentEditor
              onSubmit={handleEditSubmit}
              onCancel={handleCancelEdit}
              initialContent={editingComment.content}
              initialIsInternal={editingComment.isInternal}
              placeholder="Edit your comment..."
              submitLabel="Update Comment"
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* New Comment Editor */}
        {!editingComment && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Add Comment</h3>
            <CommentEditor
              onSubmit={handleSubmit}
              placeholder="Write a comment..."
              submitLabel="Post Comment"
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingCommentId}
          onOpenChange={(open) => !open && setDeletingCommentId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this comment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
