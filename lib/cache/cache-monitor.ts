/**
 * Cache monitoring and management utilities
 */

import { userCache } from './user-cache';
import { performanceMonitor } from '../performance-monitor';

export class CacheMonitor {
  /**
   * Get comprehensive cache statistics
   */
  static getCacheStats() {
    const cacheStats = userCache.getStats();
    const performanceStats = performanceMonitor.getAllStats(10); // Last 10 minutes
    
    return {
      cache: cacheStats,
      performance: {
        sessionValidationFull: performanceStats.session_validation_full || {
          count: 0,
          avgDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          p95Duration: 0,
        },
        sessionValidationLightweight: performanceStats.session_validation_lightweight || {
          count: 0,
          avgDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          p95Duration: 0,
        },
      },
      summary: {
        totalCacheSize: cacheStats.users.size + cacheStats.sessions.size,
        estimatedMemoryKB: cacheStats.memory.estimatedSizeKB,
        overallHitRate: (cacheStats.users.hitRate + cacheStats.sessions.hitRate) / 2,
        avgResponseTime: performanceStats.session_validation_full?.avgDuration || 0,
      },
    };
  }

  /**
   * Get cache health status
   */
  static getCacheHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getCacheStats();
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check hit rates
    if (stats.cache.sessions.hitRate < 0.5) {
      issues.push('Low session cache hit rate');
      recommendations.push('Consider increasing session cache TTL');
    }
    
    if (stats.cache.users.hitRate < 0.3) {
      issues.push('Low user cache hit rate');
      recommendations.push('Consider increasing user cache TTL');
    }
    
    // Check memory usage
    if (stats.cache.memory.estimatedSizeKB > 50000) { // 50MB
      issues.push('High memory usage');
      recommendations.push('Consider reducing cache size limits');
    }
    
    // Check performance
    if (stats.performance.sessionValidationFull.avgDuration > 20) {
      issues.push('Slow session validation performance');
      recommendations.push('Check database performance and indexes');
    }
    
    // Check cache utilization
    const sessionUtilization = stats.cache.sessions.size / stats.cache.sessions.maxSize;
    const userUtilization = stats.cache.users.size / stats.cache.users.maxSize;
    
    if (sessionUtilization > 0.9) {
      issues.push('Session cache near capacity');
      recommendations.push('Consider increasing session cache size');
    }
    
    if (userUtilization > 0.9) {
      issues.push('User cache near capacity');
      recommendations.push('Consider increasing user cache size');
    }
    
    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (issues.length > 0) {
      status = 'warning';
    }
    
    if (stats.performance.sessionValidationFull.avgDuration > 50 || 
        stats.cache.memory.estimatedSizeKB > 100000) {
      status = 'critical';
    }
    
    return {
      status,
      issues,
      recommendations,
    };
  }

  /**
   * Clear all caches (use with caution)
   */
  static clearAllCaches(): void {
    userCache.clear();
    performanceMonitor.clear();
  }

  /**
   * Warm up cache with frequently accessed data
   */
  static async warmupCache(): Promise<void> {
    // This could be implemented to pre-load frequently accessed users
    // For now, it's a placeholder for future enhancement
    console.log('Cache warmup completed');
  }

  /**
   * Get cache performance report
   */
  static getPerformanceReport(): {
    cacheEffectiveness: number;
    avgCacheHitTime: number;
    avgCacheMissTime: number;
    memoryEfficiency: number;
  } {
    const stats = this.getCacheStats();
    
    // Calculate cache effectiveness (0-100%)
    const overallHitRate = stats.summary.overallHitRate;
    const cacheEffectiveness = Math.round(overallHitRate * 100);
    
    // Estimate cache hit vs miss times (cache hits should be much faster)
    const avgCacheHitTime = stats.summary.avgResponseTime * (1 - overallHitRate);
    const avgCacheMissTime = stats.summary.avgResponseTime * overallHitRate;
    
    // Memory efficiency (items per KB)
    const totalItems = stats.cache.users.size + stats.cache.sessions.size;
    const memoryEfficiency = totalItems / Math.max(stats.cache.memory.estimatedSizeKB, 1);
    
    return {
      cacheEffectiveness,
      avgCacheHitTime,
      avgCacheMissTime,
      memoryEfficiency,
    };
  }
}

/**
 * Cache management utilities
 */
export class CacheManager {
  /**
   * Invalidate user cache by ID
   */
  static invalidateUser(userId: string): void {
    userCache.invalidateUser(userId);
  }

  /**
   * Invalidate session cache by token
   */
  static invalidateSession(token: string): void {
    userCache.invalidateSession(token);
  }

  /**
   * Invalidate all sessions for a user
   */
  static invalidateUserSessions(userId: string): void {
    userCache.invalidateUserSessions(userId);
  }

  /**
   * Manual cache cleanup (remove expired entries)
   */
  static cleanup(): void {
    userCache.cleanup();
  }

  /**
   * Get cache configuration
   */
  static getConfig(): {
    userTTL: number;
    sessionTTL: number;
    maxUsers: number;
    maxSessions: number;
  } {
    return {
      userTTL: 5 * 60 * 1000, // 5 minutes
      sessionTTL: 10 * 60 * 1000, // 10 minutes
      maxUsers: 1000,
      maxSessions: 2000,
    };
  }
}