/**
 * useKBSuggestions Hook
 * 
 * Custom hook for fetching knowledge base article suggestions with:
 * - Content-based suggestions
 * - SWR for caching
 */

import useSWR from 'swr';
import { apiClient } from '../api-client';
import { KBArticleSuggestion, GetKBSuggestionsResponse } from '../types/knowledge-base';

interface UseKBSuggestionsOptions {
  // Maximum number of suggestions
  limit?: number;
  // Enable/disable auto-fetching
  enabled?: boolean;
}

interface UseKBSuggestionsReturn {
  suggestions: KBArticleSuggestion[];
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching knowledge base article suggestions
 */
export function useKBSuggestions(
  content: string | null | undefined,
  options: UseKBSuggestionsOptions = {}
): UseKBSuggestionsReturn {
  const {
    limit = 5,
    enabled = true,
  } = options;

  // Only fetch if content is provided and enabled
  const shouldFetch = !!content && enabled && content.trim().length > 0;

  // Build query parameters
  const params: Record<string, any> = {};
  if (content) params.content = content;
  if (limit) params.limit = limit;

  // Build cache key
  const cacheKey = shouldFetch 
    ? ['/knowledge-base/suggest', params]
    : null;

  // Fetcher function
  const fetcher = async ([endpoint, params]: [string, Record<string, any>]) => {
    const response = await apiClient.get<GetKBSuggestionsResponse>(endpoint, params);
    return response.suggestions;
  };

  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR<KBArticleSuggestion[], Error>(
    cacheKey,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  // Refresh function
  const refresh = async () => {
    await mutate();
  };

  return {
    suggestions: data || [],
    isLoading,
    isError: !!error,
    error,
    refresh,
  };
}
