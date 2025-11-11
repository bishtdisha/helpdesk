/**
 * Query Cache Utility
 * Implements caching for frequently accessed data
 * Requirements: All (Performance Optimization)
 */

import { redisClient } from './redis-client';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Cache key prefix
}

export class QueryCache {
  private defaultTTL = 300; // 5 minutes default
  private prefix = 'query:';

  /**
   * Get cached data or execute query and cache result
   */
  async getOrSet<T>(
    key: string,
    queryFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cacheKey = this.buildKey(key, options?.prefix);
    const ttl = options?.ttl || this.defaultTTL;

    try {
      // Try to get from cache
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached) as T;
      }

      // Execute query
      const result = await queryFn();

      // Cache the result
      await redisClient.setex(cacheKey, ttl, JSON.stringify(result));

      return result;
    } catch (error) {
      console.error('Cache error:', error);
      // Fallback to direct query on cache error
      return await queryFn();
    }
  }

  /**
   * Invalidate cache by key
   */
  async invalidate(key: string, prefix?: string): Promise<void> {
    const cacheKey = this.buildKey(key, prefix);
    
    try {
      await redisClient.del(cacheKey);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate multiple cache keys by pattern
   */
  async invalidatePattern(pattern: string, prefix?: string): Promise<void> {
    const searchPattern = this.buildKey(pattern, prefix);
    
    try {
      const keys = await redisClient.keys(searchPattern);
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
    }
  }

  /**
   * Clear all cache entries with the default prefix
   */
  async clear(): Promise<void> {
    try {
      const keys = await redisClient.keys(`${this.prefix}*`);
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Build cache key with prefix
   */
  private buildKey(key: string, customPrefix?: string): string {
    const prefix = customPrefix || this.prefix;
    return `${prefix}${key}`;
  }
}

// Singleton instance
export const queryCache = new QueryCache();

/**
 * Cache decorators for common data types
 */

// Cache user permissions
export async function getCachedUserPermissions(
  userId: string,
  queryFn: () => Promise<any>
): Promise<any> {
  return queryCache.getOrSet(
    `user:${userId}:permissions`,
    queryFn,
    { ttl: 600, prefix: 'rbac:' } // 10 minutes
  );
}

// Cache user teams
export async function getCachedUserTeams(
  userId: string,
  queryFn: () => Promise<any>
): Promise<any> {
  return queryCache.getOrSet(
    `user:${userId}:teams`,
    queryFn,
    { ttl: 600, prefix: 'rbac:' } // 10 minutes
  );
}

// Cache ticket counts
export async function getCachedTicketCounts(
  userId: string,
  filters: string,
  queryFn: () => Promise<any>
): Promise<any> {
  return queryCache.getOrSet(
    `user:${userId}:ticket-counts:${filters}`,
    queryFn,
    { ttl: 60, prefix: 'tickets:' } // 1 minute
  );
}

// Cache analytics data
export async function getCachedAnalytics(
  scope: string,
  id: string,
  dateRange: string,
  queryFn: () => Promise<any>
): Promise<any> {
  return queryCache.getOrSet(
    `${scope}:${id}:${dateRange}`,
    queryFn,
    { ttl: 300, prefix: 'analytics:' } // 5 minutes
  );
}

// Cache knowledge base articles
export async function getCachedKBArticle(
  articleId: string,
  queryFn: () => Promise<any>
): Promise<any> {
  return queryCache.getOrSet(
    `article:${articleId}`,
    queryFn,
    { ttl: 1800, prefix: 'kb:' } // 30 minutes
  );
}

// Cache knowledge base search results
export async function getCachedKBSearch(
  query: string,
  userId: string,
  queryFn: () => Promise<any>
): Promise<any> {
  return queryCache.getOrSet(
    `search:${userId}:${query}`,
    queryFn,
    { ttl: 300, prefix: 'kb:' } // 5 minutes
  );
}

/**
 * Cache invalidation helpers
 */

// Invalidate user-related caches
export async function invalidateUserCache(userId: string): Promise<void> {
  await queryCache.invalidatePattern(`user:${userId}:*`, 'rbac:');
  await queryCache.invalidatePattern(`user:${userId}:*`, 'tickets:');
}

// Invalidate ticket-related caches
export async function invalidateTicketCache(ticketId: string): Promise<void> {
  await queryCache.invalidate(`ticket:${ticketId}`, 'tickets:');
  await queryCache.invalidatePattern(`*ticket-counts:*`, 'tickets:');
}

// Invalidate team-related caches
export async function invalidateTeamCache(teamId: string): Promise<void> {
  await queryCache.invalidatePattern(`*team:${teamId}:*`, 'rbac:');
  await queryCache.invalidatePattern(`*team:${teamId}:*`, 'analytics:');
}

// Invalidate analytics caches
export async function invalidateAnalyticsCache(scope?: string): Promise<void> {
  if (scope) {
    await queryCache.invalidatePattern(`${scope}:*`, 'analytics:');
  } else {
    await queryCache.invalidatePattern('*', 'analytics:');
  }
}

// Invalidate knowledge base caches
export async function invalidateKBCache(articleId?: string): Promise<void> {
  if (articleId) {
    await queryCache.invalidate(`article:${articleId}`, 'kb:');
  }
  await queryCache.invalidatePattern('search:*', 'kb:');
}
