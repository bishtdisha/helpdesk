/**
 * useTickets Hook
 * 
 * Custom hook for fetching and managing ticket list data with:
 * - SWR for caching and revalidation
 * - Support for filters (status, priority, team, assignee, search)
 * - Optimized polling (60 seconds instead of 30)
 * - Pagination support
 */

import useSWR from 'swr';
import { apiClient } from '../api-client';
import { GetTicketsResponse } from '../types/api';
import { TicketFilters } from '../types/ticket';
import { getCacheConfig } from '../performance/swr-config';
import { CacheManager } from '../performance/caching';

interface UseTicketsOptions extends TicketFilters {
  // Enable/disable polling
  enablePolling?: boolean;
  // Custom refresh interval (default: 60000ms)
  refreshInterval?: number;
}

interface UseTicketsReturn {
  tickets: GetTicketsResponse['data'];
  pagination: GetTicketsResponse['pagination'];
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  refresh: () => Promise<void>;
  mutate: (data?: GetTicketsResponse) => Promise<GetTicketsResponse | undefined>;
}

/**
 * Hook for fetching ticket list with filters
 */
export function useTickets(options: UseTicketsOptions = {}): UseTicketsReturn {
  const {
    enablePolling = false, // Disabled by default for better performance
    refreshInterval = 60000, // 60 seconds when enabled
    ...filters
  } = options;

  // Build cache key from filters
  const cacheKey = filters && Object.keys(filters).length > 0
    ? ['/api/tickets', filters]
    : ['/api/tickets'];

  // Fetcher function
  const fetcher = async (key: string | [string, TicketFilters?]) => {
    if (Array.isArray(key)) {
      const [endpoint, params] = key;
      return apiClient.get<GetTicketsResponse>(endpoint, params);
    }
    return apiClient.get<GetTicketsResponse>(key);
  };

  // Use SWR for data fetching with optimized cache configuration
  const cacheConfig = getCacheConfig('tickets');
  const { data, error, isLoading, mutate } = useSWR<GetTicketsResponse, Error>(
    cacheKey,
    fetcher,
    {
      ...cacheConfig,
      refreshInterval: enablePolling ? refreshInterval : 0,
      revalidateOnFocus: false, // Disable focus revalidation for better performance
      dedupingInterval: 10000, // 10 seconds deduping
    }
  );

  // Refresh function with cache invalidation
  const refresh = async () => {
    CacheManager.invalidateTicketCaches();
    await mutate();
  };

  return {
    tickets: data?.data || [],
    pagination: data?.pagination || {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    isLoading,
    isError: !!error,
    error,
    refresh,
    mutate,
  };
}
