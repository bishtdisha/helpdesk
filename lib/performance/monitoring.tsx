'use client';

import React from 'react';
import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

// Performance metrics interface
export interface PerformanceMetrics {
  // Core Web Vitals
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  pageLoadTime?: number;
  apiResponseTimes: Map<string, number[]>;
  componentRenderTimes: Map<string, number[]>;
  cacheHitRate?: number;
  memoryUsage?: number;
  
  // Timestamps
  timestamp: Date;
}

// Performance monitoring class
class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    apiResponseTimes: new Map(),
    componentRenderTimes: new Map(),
    timestamp: new Date(),
  };
  
  private observers: PerformanceObserver[] = [];
  private isEnabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'development';

  constructor() {
    if (this.isEnabled) {
      this.initializeWebVitals();
      this.initializeCustomMetrics();
    }
  }

  // Initialize Web Vitals monitoring
  private initializeWebVitals() {
    onCLS((metric: Metric) => {
      this.metrics.cls = metric.value;
      this.reportMetric('CLS', metric.value);
    });

    // Use INP (Interaction to Next Paint) instead of deprecated FID
    onINP((metric: Metric) => {
      this.metrics.fid = metric.value; // Store as fid for backward compatibility
      this.reportMetric('INP', metric.value);
    });
    
    onFCP((metric: Metric) => {
      this.metrics.fcp = metric.value;
      this.reportMetric('FCP', metric.value);
    });

    onLCP((metric: Metric) => {
      this.metrics.lcp = metric.value;
      this.reportMetric('LCP', metric.value);
    });

    onTTFB((metric: Metric) => {
      this.metrics.ttfb = metric.value;
      this.reportMetric('TTFB', metric.value);
    });
  }

  // Initialize custom performance metrics
  private initializeCustomMetrics() {
    // Monitor navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        this.metrics.pageLoadTime = nav.loadEventEnd - nav.navigationStart;
      }
    }

    // Monitor resource timing
    this.observeResourceTiming();
    
    // Monitor memory usage
    this.observeMemoryUsage();
    
    // Monitor long tasks
    this.observeLongTasks();
  }

  // Observe resource timing for API calls
  private observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name.includes('/api/')) {
            this.recordApiResponseTime(entry.name, entry.duration);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  // Observe memory usage
  private observeMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
      
      // Update memory usage every 30 seconds
      setInterval(() => {
        this.metrics.memoryUsage = memory.usedJSHeapSize;
      }, 30000);
    }
  }

  // Observe long tasks that block the main thread
  private observeLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            console.warn(`Long task detected: ${entry.duration}ms`, entry);
          });
        });
        
        observer.observe({ entryTypes: ['longtask'] });
        this.observers.push(observer);
      } catch (e) {
        // Long task observer not supported
      }
    }
  }

  // Record API response time
  recordApiResponseTime(url: string, duration: number) {
    const times = this.metrics.apiResponseTimes.get(url) || [];
    times.push(duration);
    
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }
    
    this.metrics.apiResponseTimes.set(url, times);
  }

  // Record component render time
  recordComponentRenderTime(componentName: string, duration: number) {
    const times = this.metrics.componentRenderTimes.get(componentName) || [];
    times.push(duration);
    
    // Keep only last 50 measurements
    if (times.length > 50) {
      times.shift();
    }
    
    this.metrics.componentRenderTimes.set(componentName, times);
  }

  // Get average API response time
  getAverageApiResponseTime(url?: string): number {
    if (url) {
      const times = this.metrics.apiResponseTimes.get(url) || [];
      return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
    }
    
    // Get average across all APIs
    let totalTime = 0;
    let totalCount = 0;
    
    this.metrics.apiResponseTimes.forEach((times) => {
      totalTime += times.reduce((sum, time) => sum + time, 0);
      totalCount += times.length;
    });
    
    return totalCount > 0 ? totalTime / totalCount : 0;
  }

  // Get average component render time
  getAverageComponentRenderTime(componentName?: string): number {
    if (componentName) {
      const times = this.metrics.componentRenderTimes.get(componentName) || [];
      return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
    }
    
    // Get average across all components
    let totalTime = 0;
    let totalCount = 0;
    
    this.metrics.componentRenderTimes.forEach((times) => {
      totalTime += times.reduce((sum, time) => sum + time, 0);
      totalCount += times.length;
    });
    
    return totalCount > 0 ? totalTime / totalCount : 0;
  }

  // Get performance summary
  getPerformanceSummary() {
    return {
      webVitals: {
        cls: this.metrics.cls,
        fid: this.metrics.fid,
        fcp: this.metrics.fcp,
        lcp: this.metrics.lcp,
        ttfb: this.metrics.ttfb,
      },
      pageLoadTime: this.metrics.pageLoadTime,
      averageApiResponseTime: this.getAverageApiResponseTime(),
      averageComponentRenderTime: this.getAverageComponentRenderTime(),
      memoryUsage: this.metrics.memoryUsage,
      timestamp: this.metrics.timestamp,
    };
  }

  // Get slow APIs (above threshold)
  getSlowApis(threshold = 1000): Array<{ url: string; averageTime: number }> {
    const slowApis: Array<{ url: string; averageTime: number }> = [];
    
    this.metrics.apiResponseTimes.forEach((times, url) => {
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      if (averageTime > threshold) {
        slowApis.push({ url, averageTime });
      }
    });
    
    return slowApis.sort((a, b) => b.averageTime - a.averageTime);
  }

  // Get slow components (above threshold)
  getSlowComponents(threshold = 100): Array<{ name: string; averageTime: number }> {
    const slowComponents: Array<{ name: string; averageTime: number }> = [];
    
    this.metrics.componentRenderTimes.forEach((times, name) => {
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      if (averageTime > threshold) {
        slowComponents.push({ name, averageTime });
      }
    });
    
    return slowComponents.sort((a, b) => b.averageTime - a.averageTime);
  }

  // Report metric to console (development) or analytics (production)
  private reportMetric(name: string, value: number) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value}`);
    } else {
      // In production, send to analytics service
      // This could be Google Analytics, DataDog, etc.
      this.sendToAnalytics(name, value);
    }
  }

  // Send metrics to analytics service
  private sendToAnalytics(name: string, value: number) {
    // Example implementation - replace with your analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: value,
        custom_parameter: 'performance_monitoring',
      });
    }
  }

  // Export metrics for debugging
  exportMetrics(): string {
    return JSON.stringify({
      ...this.getPerformanceSummary(),
      slowApis: this.getSlowApis(),
      slowComponents: this.getSlowComponents(),
    }, null, 2);
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics = {
      apiResponseTimes: new Map(),
      componentRenderTimes: new Map(),
      timestamp: new Date(),
    };
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Hook for component performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const startTime = performance.now();
  
  React.useEffect(() => {
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      performanceMonitor.recordComponentRenderTime(componentName, duration);
    };
  }, [componentName, startTime]);
}

// Hook for API performance monitoring
export function useApiPerformanceMonitoring() {
  const recordApiCall = (url: string, startTime: number) => {
    const duration = performance.now() - startTime;
    performanceMonitor.recordApiResponseTime(url, duration);
  };

  return { recordApiCall };
}

// Performance debugging component (development only)
export function PerformanceDebugger() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const [isOpen, setIsOpen] = React.useState(false);
  const [metrics, setMetrics] = React.useState(performanceMonitor.getPerformanceSummary());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getPerformanceSummary());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50"
        title="Performance Monitor"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border shadow-lg rounded-lg p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Performance Monitor</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-500">×</button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Web Vitals:</strong>
          <div className="ml-2">
            {metrics.webVitals.lcp && <div>LCP: {metrics.webVitals.lcp.toFixed(2)}ms</div>}
            {metrics.webVitals.fcp && <div>FCP: {metrics.webVitals.fcp.toFixed(2)}ms</div>}
            {metrics.webVitals.fid && <div>INP: {metrics.webVitals.fid.toFixed(2)}ms</div>}
            {metrics.webVitals.cls && <div>CLS: {metrics.webVitals.cls.toFixed(3)}</div>}
            {metrics.webVitals.ttfb && <div>TTFB: {metrics.webVitals.ttfb.toFixed(2)}ms</div>}
          </div>
        </div>
        
        <div>
          <strong>Load Time:</strong> {metrics.pageLoadTime?.toFixed(2)}ms
        </div>
        
        <div>
          <strong>Avg API Time:</strong> {metrics.averageApiResponseTime.toFixed(2)}ms
        </div>
        
        <div>
          <strong>Memory:</strong> {(metrics.memoryUsage! / 1024 / 1024).toFixed(2)}MB
        </div>
        
        <button
          onClick={() => console.log(performanceMonitor.exportMetrics())}
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Export to Console
        </button>
      </div>
    </div>
  );
}