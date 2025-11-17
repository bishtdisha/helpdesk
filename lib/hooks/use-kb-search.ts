/**
 * useKBSearch Hook
 * 
 * Custom hook for searching knowledge base articles with:
 * - Debounced search
 * - SWR for caching
 */

import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { apiClient } from '../api-client';
import { KBArticle, KBFilters, SearchKBArticlesResponse } from '../types/knowledge-base';

interface UseKBSearchOptions extends Omit<KBFilters, 'search'> {
  // Debounce delay in milliseconds
  debounceMs?: number;
}

interface UseKBSearchReturn {
  results: KBArticle[];
  isSearching: boolean;
  isError: boolean;
  error: Error | undefined;
  search: (query: string) => void;
  clearSearch: () => void;
  query: string;
}

/**
 * Hook for searching knowledge base articles
 */
export function useKBSearch(
  options: UseKBSearchOptions = {}
): UseKBSearchReturn {
  const {
    debounceMs = 300,
    accessLevel,
    teamId,
    categoryId,
    isPublished,
  } = options;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Build query parameters
  const params: Record<string, any> = {};
  if (debouncedQuery) params.q = debouncedQuery;
  if (accessLevel) params.accessLevel = accessLevel;
  if (teamId) params.teamId = teamId;
  if (categoryId) params.categoryId = categoryId;
  if (isPublished !== undefined) params.isPublished = isPublished;

  // Build cache key - only fetch if there's a query
  const cacheKey = debouncedQuery 
    ? ['/knowledge-base/search', params]
    : null;

  // Fetcher function
  const fetcher = async ([endpoint, params]: [string, Record<string, any>]) => {
    const response = await apiClient.get<SearchKBArticlesResponse>(endpoint, params);
    return response.articles;
  };

  // Use SWR for data fetching
  const { data, error, isLoading } = useSWR<KBArticle[], Error>(
    cacheKey,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  );

  // Search function
  const search = (newQuery: string) => {
    setQuery(newQuery);
  };

  // Clear search function
  const clearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
  };

  return {
    results: data || [],
    isSearching: isLoading,
    isError: !!error,
    error,
    search,
    clearSearch,
    query,
  };
}
