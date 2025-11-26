'use client';

/**
 * Client-side performance monitoring utilities
 * Helps track and optimize frontend performance
 */

export class ClientPerformance {
  /**
   * Measure component render time
   */
  static measureRender(componentName: string, callback: () => void) {
    const start = performance.now();
    callback();
    const end = performance.now();
    const duration = end - start;
    
    if (duration > 16) { // Slower than 60fps
      console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  /**
   * Measure API call time
   */
  static async measureAPI(url: string, fetchFn: () => Promise<any>) {
    const start = performance.now();
    try {
      const result = await fetchFn();
      const end = performance.now();
      const duration = end - start;
      
      if (duration > 500) {
        console.warn(`[Performance] API ${url} took ${duration.toFixed(2)}ms`);
      }
      
      return { result, duration };
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      console.error(`[Performance] API ${url} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  /**
   * Get Web Vitals metrics
   */
  static getWebVitals() {
    if (typeof window === 'undefined') return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      // Time to First Byte
      ttfb: navigation?.responseStart - navigation?.requestStart,
      // DOM Content Loaded
      dcl: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
      // Load Complete
      load: navigation?.loadEventEnd - navigation?.loadEventStart,
      // First Contentful Paint (requires web-vitals library)
      fcp: null, // Use web-vitals library for accurate FCP
    };
  }

  /**
   * Log performance metrics to console (dev only)
   */
  static logMetrics() {
    if (process.env.NODE_ENV !== 'development') return;

    const vitals = this.getWebVitals();
    console.group('📊 Performance Metrics');
    console.table(vitals);
    console.groupEnd();
  }

  /**
   * Monitor long tasks (tasks > 50ms)
   */
  static monitorLongTasks() {
    if (typeof window === 'undefined') return;
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }
}

/**
 * Hook to measure component mount time
 */
export function usePerformanceMonitor(componentName: string) {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'development') return;

  const mountTime = performance.now();
  
  return () => {
    const unmountTime = performance.now();
    const lifetime = unmountTime - mountTime;
    console.log(`[Performance] ${componentName} lifetime: ${lifetime.toFixed(2)}ms`);
  };
}
