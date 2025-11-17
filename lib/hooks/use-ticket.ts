/**
 * useTicket Hook
 * 
 * Custom hook for fetching single ticket data with:
 * - SWR for caching and revalidation
 * - 30-second polling for real-time updates
 * - Full ticket details with relationships
 */

import useSWR from 'swr';
import { apiClient } from '../api-client';
import { TicketWithRelations } from '../types/ticket';

interface UseTicketOptions {
  // Enable/disable polling
  enablePolling?: boolean;
  // Custom refresh interval (default: 30000ms)
  refreshInterval?: number;
}

interface UseTicketReturn {
  ticket: TicketWithRelations | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  refresh: () => Promise<void>;
  mutate: (data?: TicketWithRelations) => Promise<TicketWithRelations | undefined>;
}

/**
 * Hook for fetching single ticket by ID
 */
export function useTicket(
  ticketId: string | null | undefined,
  options: UseTicketOptions = {}
): UseTicketReturn {
  const {
    enablePolling = true,
    refreshInterval = 30000, // 30 seconds
  } = options;

  // Only fetch if ticketId is provided
  const shouldFetch = !!ticketId;

  // Fetcher function
  const fetcher = async (endpoint: string) => {
    const response = await apiClient.get<{ ticket: TicketWithRelations }>(endpoint);
    return response.ticket;
  };

  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR<TicketWithRelations, Error>(
    shouldFetch ? `/api/tickets/${ticketId}` : null,
    fetcher,
    {
      refreshInterval: enablePolling ? refreshInterval : 0,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
    }
  );

  // Refresh function
  const refresh = async () => {
    await mutate();
  };

  return {
    ticket: data || null,
    isLoading,
    isError: !!error,
    error,
    refresh,
    mutate,
  };
}
