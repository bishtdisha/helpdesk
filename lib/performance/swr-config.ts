'use client';

import useSWR, { mutate, SWRConfiguration } from 'swr';
import useSWRInfinite from 'swr/infinite';
import { apiClient } from '@/lib/api-client';
import { CACHE_CONFIG, CachePerformance } from './caching';

// Global SWR configuration - optimized for performance
export const swrConfig: SWRConfiguration = {
  // Default fetcher using our API client
  fetcher: (url: string) => apiClient.get(url),
  
  // Error retry configuration
  errorRetryCount: 2,
  errorRetryInterval: 2000,
  
  // Disable focus revalidation for better performance
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  
  // Increased deduping interval
  dedupingInterval: 10000,
  
  // Loading timeout
  loadingTimeout: 15000,
  
  // Keep previous data while revalidating
  keepPreviousData: true,
  
  // Fallback data
  fallbackData: undefined,
  
  // Success callback - disabled in production for performance
  onSuccess: process.env.NODE_ENV === 'development' 
    ? (data, key) => CachePerformance.recordCacheHit(key)
    : undefined,
  
  // Error callback - minimal logging
  onError: process.env.NODE_ENV === 'development'
    ? (error, key) => CachePerformance.recordCacheMiss(key)
    : undefined,
};

// Get cache configuration for specific data type
export function getCacheConfig(dataType: keyof typeof CACHE_CONFIG): SWRConfiguration {
  const config = CACHE_CONFIG[dataType];
  
  return {
    ...swrConfig,
    refreshInterval: config.refreshInterval,
    revalidateOnFocus: config.revalidateOnFocus,
    revalidateOnReconnect: config.revalidateOnReconnect,
    dedupingInterval: config.dedupingInterval,
  };
}

// Smart cache configuration based on URL pattern
export function getSmartCacheConfig(url: string): SWRConfiguration {
  // Tickets - frequently changing
  if (url.includes('/api/tickets')) {
    return getCacheConfig('tickets');
  }
  
  // Analytics - moderately changing
  if (url.includes('/api/analytics')) {
    return getCacheConfig('analytics');
  }
  
  // Knowledge base - slowly changing
  if (url.includes('/api/knowledge-base')) {
    return getCacheConfig('knowledgeBase');
  }
  
  // Users - rarely changing
  if (url.includes('/api/users')) {
    return getCacheConfig('users');
  }
  
  // Preferences - static-like
  if (url.includes('/preferences') || url.includes('/settings')) {
    return getCacheConfig('preferences');
  }
  
  // Default configuration
  return swrConfig;
}

// Hook factory for optimized SWR usage
export function createOptimizedSWRHook<T>(
  dataType: keyof typeof CACHE_CONFIG,
  keyGenerator: (...args: any[]) => string | null,
  options?: SWRConfiguration
) {
  return function useOptimizedSWR(...args: any[]) {
    const key = keyGenerator(...args);
    const config = getCacheConfig(dataType);
    
    return useSWR<T>(key, {
      ...config,
      ...options,
    });
  };
}

// Conditional SWR hook - only fetch when condition is met
export function useConditionalSWR<T>(
  key: string | null,
  condition: boolean,
  options?: SWRConfiguration
) {
  return useSWR<T>(condition ? key : null, {
    ...swrConfig,
    ...options,
  });
}

// Paginated SWR hook with optimized caching
export function usePaginatedSWR<T>(
  baseKey: string,
  page: number,
  limit: number,
  options?: SWRConfiguration
) {
  const key = `${baseKey}?page=${page}&limit=${limit}`;
  
  return useSWR<T>(key, {
    ...getCacheConfig('tickets'), // Most paginated data is tickets
    ...options,
    // Keep previous data while loading new page
    keepPreviousData: true,
  });
}

// Infinite SWR hook for large datasets
export function useInfiniteSWR<T>(
  getKey: (pageIndex: number, previousPageData: T | null) => string | null,
  options?: SWRConfiguration
) {
  return useSWRInfinite<T>(getKey, {
    ...getCacheConfig('tickets'),
    ...options,
    // Revalidate first page on focus
    revalidateFirstPage: true,
    // Parallel fetching for better performance
    parallel: true,
  });
}

// Mutation hook with optimistic updates
export function useOptimisticMutation<T>(
  key: string,
  mutationFn: (...args: any[]) => Promise<T>,
  optimisticUpdate?: (currentData: T, ...args: any[]) => T
) {
  return {
    trigger: async (...args: any[]) => {
      // Apply optimistic update
      if (optimisticUpdate) {
        mutate(key, (currentData: T) => optimisticUpdate(currentData, ...args), false);
      }
      
      try {
        // Perform actual mutation
        const result = await mutationFn(...args);
        
        // Revalidate with real data
        mutate(key);
        
        return result;
      } catch (error) {
        // Revert optimistic update on error
        mutate(key);
        throw error;
      }
    },
  };
}

// Note: Batch SWR requests removed - use individual useSWR calls instead
// React hooks cannot be called inside callbacks/loops

