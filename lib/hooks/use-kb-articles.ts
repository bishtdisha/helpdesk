/**
 * useKBArticles Hook
 * 
 * Custom hook for fetching knowledge base articles with:
 * - SWR for caching and revalidation
 * - Role-based filtering
 * - Category and search filtering
 */

import useSWR from 'swr';
import { apiClient } from '../api-client';
import { 
  KBArticle, 
  KBFilters, 
  GetKBArticlesResponse 
} from '../types/knowledge-base';

interface UseKBArticlesOptions extends KBFilters {
  // Enable/disable auto-fetching
  enabled?: boolean;
}

interface UseKBArticlesReturn {
  articles: KBArticle[];
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  refresh: () => Promise<void>;
  mutate: (data?: KBArticle[]) => Promise<KBArticle[] | undefined>;
}

/**
 * Hook for fetching knowledge base articles
 */
export function useKBArticles(
  options: UseKBArticlesOptions = {}
): UseKBArticlesReturn {
  const {
    enabled = true,
    accessLevel,
    teamId,
    categoryId,
    isPublished,
    search,
  } = options;

  // Build query parameters
  const params: Record<string, any> = {};
  if (accessLevel) params.accessLevel = accessLevel;
  if (teamId) params.teamId = teamId;
  if (categoryId) params.categoryId = categoryId;
  if (isPublished !== undefined) params.isPublished = isPublished;
  if (search) params.search = search;

  // Build cache key
  const cacheKey = enabled 
    ? ['/knowledge-base/articles', params]
    : null;

  // Fetcher function
  const fetcher = async ([endpoint, params]: [string, Record<string, any>]) => {
    const response = await apiClient.get<GetKBArticlesResponse>(endpoint, params);
    return response.articles;
  };

  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR<KBArticle[], Error>(
    cacheKey,
    fetcher,
    {
      refreshInterval: 0, // No auto-refresh for KB articles
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
    articles: data || [],
    isLoading,
    isError: !!error,
    error,
    refresh,
    mutate,
  };
}
