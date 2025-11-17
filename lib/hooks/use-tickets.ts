/**
 * useTickets Hook
 * 
 * Custom hook for fetching and managing ticket list data with:
 * - SWR for caching and revalidation
 * - Support for filters (status, priority, team, assignee, search)
 * - 30-second polling for real-time updates
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
  // Custom refresh interval (default: 30000ms)
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
    enablePolling = true,
    refreshInterval = 30000, // 30 seconds
    ...filters
  } = options;

  // Build cache key from filters
  const cacheKey = filters && Object.keys(filters).length > 0
    ? ['/api/tickets', filters]
    : '/api/tickets';

  // Fetcher function
  const fetcher = async ([endpoint, params]: [string, TicketFilters?]) => {
    return apiClient.get<GetTicketsResponse>(endpoint, params);
  };

  // Use SWR for data fetching with optimized cache configuration
  const cacheConfig = getCacheConfig('tickets');
  const { data, error, isLoading, mutate } = useSWR<GetTicketsResponse, Error>(
    cacheKey,
    fetcher,
    {
      ...cacheConfig,
      refreshInterval: enablePolling ? (refreshInterval || cacheConfig.refreshInterval) : 0,
      // Override with custom options if provided
      ...(options.refreshInterval && { refreshInterval: options.refreshInterval }),
    }
  );

  // Refresh function with cache invalidation
  const refresh = async () => {
    // Invalidate related caches
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
