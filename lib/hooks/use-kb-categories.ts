/**
 * useKBCategories Hook
 * 
 * Custom hook for fetching knowledge base categories with:
 * - SWR for caching and revalidation
 * - Parent-child relationships
 */

import useSWR from 'swr';
import { apiClient } from '../api-client';
import { KBCategory, GetKBCategoriesResponse } from '../types/knowledge-base';

interface UseKBCategoriesOptions {
  // Enable/disable auto-fetching
  enabled?: boolean;
}

interface UseKBCategoriesReturn {
  categories: KBCategory[];
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  refresh: () => Promise<void>;
  mutate: (data?: KBCategory[]) => Promise<KBCategory[] | undefined>;
}

/**
 * Hook for fetching knowledge base categories
 */
export function useKBCategories(
  options: UseKBCategoriesOptions = {}
): UseKBCategoriesReturn {
  const { enabled = true } = options;

  // Fetcher function
  const fetcher = async (endpoint: string) => {
    const response = await apiClient.get<GetKBCategoriesResponse>(endpoint);
    return response.categories;
  };

  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR<KBCategory[], Error>(
    enabled ? '/knowledge-base/categories' : null,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Cache for 5 minutes
    }
  );

  // Refresh function
  const refresh = async () => {
    await mutate();
  };

  return {
    categories: data || [],
    isLoading,
    isError: !!error,
    error,
    refresh,
    mutate,
  };
}
