/**
 * useTicketHistory Hook
 * 
 * Custom hook for fetching ticket history/activity timeline with:
 * - SWR for caching and revalidation
 * - Combined history, comments, and attachments
 * - Chronological sorting
 */

import useSWR from 'swr';
import { apiClient } from '../api-client';

export interface TicketHistoryEntry {
  id: string;
  ticketId: string;
  userId: string;
  action: string;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface TicketComment {
  id: string;
  content: string;
  ticketId: string;
  authorId: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  uploadedBy: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string | null;
  createdAt: string;
  uploader: {
    id: string;
    name: string | null;
    email: string;
  };
}

export type TimelineActivity = 
  | { type: 'history'; data: TicketHistoryEntry }
  | { type: 'comment'; data: TicketComment }
  | { type: 'attachment'; data: TicketAttachment };

interface UseTicketHistoryReturn {
  activities: TimelineActivity[];
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching ticket history and combining with comments/attachments
 */
export function useTicketHistory(
  ticketId: string | null | undefined,
  comments?: TicketComment[],
  attachments?: TicketAttachment[]
): UseTicketHistoryReturn {
  // Only fetch if ticketId is provided
  const shouldFetch = !!ticketId;

  // Fetcher function for history
  const fetcher = async (endpoint: string) => {
    const response = await apiClient.get<{ history: TicketHistoryEntry[] }>(endpoint);
    return response.history;
  };

  // Use SWR for data fetching
  const { data: history, error, isLoading, mutate } = useSWR<TicketHistoryEntry[], Error>(
    shouldFetch ? `/api/tickets/${ticketId}/history` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Prevent duplicate requests within 10 seconds
    }
  );

  // Combine and sort all activities
  const activities: TimelineActivity[] = [];

  // Add history entries
  if (history) {
    history.forEach(entry => {
      activities.push({ type: 'history', data: entry });
    });
  }

  // Add comments
  if (comments) {
    comments.forEach(comment => {
      activities.push({ type: 'comment', data: comment });
    });
  }

  // Add attachments
  if (attachments) {
    attachments.forEach(attachment => {
      activities.push({ type: 'attachment', data: attachment });
    });
  }

  // Sort by createdAt in descending order (newest first)
  activities.sort((a, b) => {
    const dateA = new Date(a.data.createdAt).getTime();
    const dateB = new Date(b.data.createdAt).getTime();
    return dateB - dateA;
  });

  // Refresh function
  const refresh = async () => {
    await mutate();
  };

  return {
    activities,
    isLoading,
    isError: !!error,
    error,
    refresh,
  };
}
