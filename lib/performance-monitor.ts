/**
 * Performance monitoring utility for tracking session validation improvements
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Start timing an operation
   */
  startTimer(operation: string): () => void {
    const startTime = performance.now();
    
    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration, metadata);
      return duration;
    };
  }

  /**
   * Record a performance metric
   */
  private recordMetric(operation: string, duration: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only the last N metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations (> 50ms)
    if (duration > 50) {
      console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`, metadata);
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operation: string, lastNMinutes = 5): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
  } {
    const cutoff = new Date(Date.now() - lastNMinutes * 60 * 1000);
    const relevantMetrics = this.metrics
      .filter(m => m.operation === operation && m.timestamp > cutoff)
      .map(m => m.duration)
      .sort((a, b) => a - b);

    if (relevantMetrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
      };
    }

    const sum = relevantMetrics.reduce((a, b) => a + b, 0);
    const p95Index = Math.floor(relevantMetrics.length * 0.95);

    return {
      count: relevantMetrics.length,
      avgDuration: sum / relevantMetrics.length,
      minDuration: relevantMetrics[0],
      maxDuration: relevantMetrics[relevantMetrics.length - 1],
      p95Duration: relevantMetrics[p95Index] || relevantMetrics[relevantMetrics.length - 1],
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats(lastNMinutes = 5): Record<string, ReturnType<typeof this.getStats>> {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    const stats: Record<string, ReturnType<typeof this.getStats>> = {};

    for (const operation of operations) {
      stats[operation] = this.getStats(operation, lastNMinutes);
    }

    return stats;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for timing async functions
 */
export function timed(operationName: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const endTimer = performanceMonitor.startTimer(operationName);
      try {
        const result = await originalMethod.apply(this, args);
        endTimer({ success: true });
        return result;
      } catch (error) {
        endTimer({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    } as T;

    return descriptor;
  };
}