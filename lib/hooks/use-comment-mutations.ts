import { apiClient } from '@/lib/api-client';
import { useComments } from './use-comments';

interface CreateCommentData {
  content: string;
  isInternal?: boolean;
}

interface UpdateCommentData {
  content: string;
}

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

/**
 * Hook for comment mutations (create, update, delete)
 */
export function useCommentMutations(ticketId: string) {
  const { refresh } = useComments(ticketId);

  /**
   * Add a comment to a ticket
   */
  const addComment = async (data: CreateCommentData): Promise<Comment> => {
    const response = await apiClient.post<{ comment: Comment; message: string }>(
      `/api/tickets/${ticketId}/comments`,
      data
    );
    
    // Refresh the comments list
    await refresh();
    
    return response.comment;
  };

  /**
   * Update a comment
   */
  const updateComment = async (commentId: string, data: UpdateCommentData): Promise<Comment> => {
    const response = await apiClient.put<{ comment: Comment; message: string }>(
      `/api/tickets/${ticketId}/comments/${commentId}`,
      data
    );
    
    // Refresh the comments list
    await refresh();
    
    return response.comment;
  };

  /**
   * Delete a comment
   */
  const deleteComment = async (commentId: string): Promise<void> => {
    await apiClient.delete<{ message: string }>(
      `/api/tickets/${ticketId}/comments/${commentId}`
    );
    
    // Refresh the comments list
    await refresh();
  };

  return {
    addComment,
    updateComment,
    deleteComment,
  };
}
