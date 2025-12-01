'use client';

import useSWR, { mutate, SWRConfiguration } from 'swr';
import useSWRInfinite from 'swr/infinite';
import { apiClient } from '@/lib/api-client';
import { CACHE_CONFIG, CachePerformance } from './caching';

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
  // Default fetcher using our API client
  fetcher: (url: string) => apiClient.get(url),
  
  // Error retry configuration
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  
  // Focus revalidation
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  
  // Deduping
  dedupingInterval: 5000,
  
  // Loading timeout
  loadingTimeout: 10000,
  
  // Error timeout
  errorRetryInterval: 1000,
  
  // Keep previous data while revalidating
  keepPreviousData: true,
  
  // Fallback data
  fallbackData: undefined,
  
  // Success callback
  onSuccess: (data, key) => {
    if (process.env.NODE_ENV === 'development') {
      CachePerformance.recordCacheHit(key);
    }
  },
  
  // Error callback
  onError: (error, key) => {
    if (process.env.NODE_ENV === 'development') {
      CachePerformance.recordCacheMiss(key);
      console.error(`SWR Error for ${key}:`, error);
    }
  },
  
  // Loading callback
  onLoadingSlow: (key) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`SWR slow loading for ${key}`);
    }
  },
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

// Batch SWR requests for better performance
export function useBatchSWR<T>(keys: string[], options?: SWRConfiguration) {
  const results = keys.map(key => 
    useSWR<T>(key, {
      ...swrConfig,
      ...options,
    })
  );
  
  return {
    data: results.map(r => r.data),
    error: results.find(r => r.error)?.error,
    isLoading: results.some(r => r.isLoading),
    isValidating: results.some(r => r.isValidating),
    mutate: () => Promise.all(results.map(r => r.mutate())),
  };
}

