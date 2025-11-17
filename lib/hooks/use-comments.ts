import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';

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

interface CommentsResponse {
  comments: Comment[];
  total: number;
}

/**
 * Hook to fetch comments for a ticket
 */
export function useComments(ticketId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<CommentsResponse>(
    ticketId ? `/api/tickets/${ticketId}/comments` : null,
    (url: string) => apiClient.get<CommentsResponse>(url),
    {
      refreshInterval: 30000, // Poll every 30 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    comments: data?.comments || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
