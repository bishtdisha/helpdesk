/**
 * useKBArticle Hook
 * 
 * Custom hook for fetching a single knowledge base article with:
 * - SWR for caching and revalidation
 * - Automatic view tracking
 */

import useSWR from 'swr';
import { useEffect, useRef } from 'react';
import { apiClient } from '../api-client';
import { KBArticle, GetKBArticleResponse } from '../types/knowledge-base';

interface UseKBArticleOptions {
  // Enable/disable auto-fetching
  enabled?: boolean;
  // Track view automatically
  trackView?: boolean;
}

interface UseKBArticleReturn {
  article: KBArticle | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  refresh: () => Promise<void>;
  mutate: (data?: KBArticle) => Promise<KBArticle | undefined>;
  recordView: () => Promise<void>;
  recordHelpful: () => Promise<void>;
}

/**
 * Hook for fetching single knowledge base article by ID
 */
export function useKBArticle(
  articleId: string | null | undefined,
  options: UseKBArticleOptions = {}
): UseKBArticleReturn {
  const {
    enabled = true,
    trackView = true,
  } = options;

  const viewTracked = useRef(false);

  // Only fetch if articleId is provided and enabled
  const shouldFetch = !!articleId && enabled;

  // Fetcher function
  const fetcher = async (endpoint: string) => {
    const response = await apiClient.get<GetKBArticleResponse>(endpoint);
    return response.article;
  };

  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR<KBArticle, Error>(
    shouldFetch ? `/knowledge-base/articles/${articleId}` : null,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  // Record view function
  const recordView = async () => {
    if (!articleId) return;
    
    try {
      await apiClient.post(`/knowledge-base/articles/${articleId}/view`);
      // Refresh article data to get updated view count
      await mutate();
    } catch (error) {
      console.error('Failed to record view:', error);
    }
  };

  // Record helpful function
  const recordHelpful = async () => {
    if (!articleId) return;
    
    try {
      await apiClient.post(`/knowledge-base/articles/${articleId}/helpful`);
      // Refresh article data to get updated helpful count
      await mutate();
    } catch (error) {
      console.error('Failed to record helpful vote:', error);
    }
  };

  // Track view automatically when article loads
  useEffect(() => {
    if (data && trackView && !viewTracked.current && articleId) {
      viewTracked.current = true;
      recordView();
    }
  }, [data, trackView, articleId]);

  // Reset view tracking when article changes
  useEffect(() => {
    viewTracked.current = false;
  }, [articleId]);

  // Refresh function
  const refresh = async () => {
    await mutate();
  };

  return {
    article: data || null,
    isLoading,
    isError: !!error,
    error,
    refresh,
    mutate,
    recordView,
    recordHelpful,
  };
}
