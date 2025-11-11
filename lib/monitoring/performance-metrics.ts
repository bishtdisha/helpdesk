/**
 * Performance Metrics Monitoring
 * Tracks and reports performance metrics
 * Requirements: All (Performance Optimization)
 */

import { prisma } from '@/lib/db';

export interface PerformanceMetrics {
  slowQueries: SlowQuery[];
  cacheHitRate: number;
  averageResponseTime: number;
  databaseConnectionPool: ConnectionPoolStats;
  topEndpoints: EndpointStats[];
}

export interface SlowQuery {
  query: string;
  duration: number;
  timestamp: Date;
  userId?: string;
}

export interface ConnectionPoolStats {
  active: number;
  idle: number;
  waiting: number;
  total: number;
}

export interface EndpointStats {
  endpoint: string;
  count: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
}

class PerformanceMonitor {
  private slowQueryThreshold = 1000; // 1 second
  private slowQueries: SlowQuery[] = [];
  private endpointMetrics: Map<string, number[]> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Track query execution time
   */
  async trackQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    userId?: string
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        this.logSlowQuery(queryName, duration, userId);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Query failed: ${queryName} (${duration}ms)`, error);
      throw error;
    }
  }

  /**
   * Track API endpoint performance
   */
  trackEndpoint(endpoint: string, duration: number): void {
    if (!this.endpointMetrics.has(endpoint)) {
      this.endpointMetrics.set(endpoint, []);
    }

    const metrics = this.endpointMetrics.get(endpoint)!;
    metrics.push(duration);

    // Keep only last 100 requests per endpoint
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    if (total === 0) return 0;
    return (this.cacheHits / total) * 100;
  }

  /**
   * Get slow queries
   */
  getSlowQueries(limit = 10): SlowQuery[] {
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get top endpoints by request count
   */
  getTopEndpoints(limit = 10): EndpointStats[] {
    const stats: EndpointStats[] = [];

    for (const [endpoint, durations] of this.endpointMetrics.entries()) {
      if (durations.length === 0) continue;

      stats.push({
        endpoint,
        count: durations.length,
        averageTime: durations.reduce((a, b) => a + b, 0) / durations.length,
        maxTime: Math.max(...durations),
        minTime: Math.min(...durations),
      });
    }

    return stats
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get database connection pool stats
   */
  async getConnectionPoolStats(): Promise<ConnectionPoolStats> {
    // This is a placeholder - actual implementation depends on database driver
    // For Prisma, you would need to access internal metrics
    return {
      active: 0,
      idle: 0,
      waiting: 0,
      total: 0,
    };
  }

  /**
   * Get comprehensive performance metrics
   */
  async getMetrics(): Promise<PerformanceMetrics> {
    const topEndpoints = this.getTopEndpoints();
    const averageResponseTime =
      topEndpoints.length > 0
        ? topEndpoints.reduce((sum, e) => sum + e.averageTime, 0) /
          topEndpoints.length
        : 0;

    return {
      slowQueries: this.getSlowQueries(),
      cacheHitRate: this.getCacheHitRate(),
      averageResponseTime,
      databaseConnectionPool: await this.getConnectionPoolStats(),
      topEndpoints,
    };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.slowQueries = [];
    this.endpointMetrics.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Log slow query
   */
  private logSlowQuery(query: string, duration: number, userId?: string): void {
    this.slowQueries.push({
      query,
      duration,
      timestamp: new Date(),
      userId,
    });

    // Keep only last 50 slow queries
    if (this.slowQueries.length > 50) {
      this.slowQueries.shift();
    }

    console.warn(`Slow query detected: ${query} (${duration}ms)`);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware to track API endpoint performance
 */
export function createPerformanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const endpoint = `${req.method} ${req.path}`;

    // Track response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      performanceMonitor.trackEndpoint(endpoint, duration);

      // Log slow endpoints
      if (duration > 2000) {
        console.warn(`Slow endpoint: ${endpoint} (${duration}ms)`);
      }
    });

    next();
  };
}

/**
 * Database query performance analyzer
 */
export async function analyzeDatabasePerformance() {
  console.log('Analyzing database performance...\n');

  try {
    // Get table sizes
    const tableSizes = await prisma.$queryRaw<
      Array<{ table_name: string; size: string; row_count: number }>
    >`
      SELECT 
        schemaname || '.' || tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        n_live_tup as row_count
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10;
    `;

    console.log('Top 10 Largest Tables:');
    console.table(tableSizes);

    // Get index usage
    const indexUsage = await prisma.$queryRaw<
      Array<{
        table_name: string;
        index_name: string;
        index_scans: number;
        index_size: string;
      }>
    >`
      SELECT 
        schemaname || '.' || tablename as table_name,
        indexrelname as index_name,
        idx_scan as index_scans,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
        AND indexrelname NOT LIKE '%_pkey'
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT 10;
    `;

    console.log('\nUnused Indexes (consider removing):');
    console.table(indexUsage);

    // Get cache hit ratio
    const cacheHitRatio = await prisma.$queryRaw<
      Array<{ cache_hit_ratio: number }>
    >`
      SELECT 
        ROUND(
          (sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) * 100,
          2
        ) as cache_hit_ratio
      FROM pg_statio_user_tables;
    `;

    console.log('\nDatabase Cache Hit Ratio:');
    console.log(`${cacheHitRatio[0]?.cache_hit_ratio || 0}%`);
    console.log('(Target: > 95%)\n');

    // Get most accessed tables
    const tableAccess = await prisma.$queryRaw<
      Array<{
        table_name: string;
        seq_scans: number;
        index_scans: number;
        total_scans: number;
      }>
    >`
      SELECT 
        schemaname || '.' || tablename as table_name,
        seq_scan as seq_scans,
        idx_scan as index_scans,
        seq_scan + idx_scan as total_scans
      FROM pg_stat_user_tables
      ORDER BY seq_scan + idx_scan DESC
      LIMIT 10;
    `;

    console.log('Most Accessed Tables:');
    console.table(tableAccess);

    // Get slow queries (if pg_stat_statements is enabled)
    try {
      const slowQueries = await prisma.$queryRaw<
        Array<{
          query: string;
          calls: number;
          mean_time: number;
          total_time: number;
        }>
      >`
        SELECT 
          LEFT(query, 100) as query,
          calls,
          ROUND(mean_exec_time::numeric, 2) as mean_time,
          ROUND(total_exec_time::numeric, 2) as total_time
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_exec_time DESC
        LIMIT 10;
      `;

      console.log('\nSlowest Queries (by average time):');
      console.table(slowQueries);
    } catch (error) {
      console.log('\nNote: pg_stat_statements extension not enabled');
      console.log('Enable it for detailed query performance tracking');
    }

    console.log('\n✅ Database performance analysis completed');
  } catch (error) {
    console.error('Error analyzing database performance:', error);
  }
}
