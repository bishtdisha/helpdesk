'use client';

import React from 'react';

// Bundle size tracking utility
export interface BundleMetrics {
  componentName: string;
  loadTime: number;
  bundleSize?: number;
  timestamp: Date;
}

class BundleAnalyzer {
  private metrics: BundleMetrics[] = [];
  private isEnabled = process.env.NODE_ENV === 'development';

  trackComponentLoad(componentName: string, startTime: number) {
    if (!this.isEnabled) return;

    const loadTime = performance.now() - startTime;
    const metric: BundleMetrics = {
      componentName,
      loadTime,
      timestamp: new Date(),
    };

    this.metrics.push(metric);
    
    // Log to console in development
    console.log(`[Bundle Analyzer] ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
  }

  getMetrics(): BundleMetrics[] {
    return [...this.metrics];
  }

  getAverageLoadTime(componentName: string): number {
    const componentMetrics = this.metrics.filter(m => m.componentName === componentName);
    if (componentMetrics.length === 0) return 0;
    
    const totalTime = componentMetrics.reduce((sum, m) => sum + m.loadTime, 0);
    return totalTime / componentMetrics.length;
  }

  getSlowestComponents(limit = 5): BundleMetrics[] {
    return [...this.metrics]
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, limit);
  }

  clearMetrics() {
    this.metrics = [];
  }

  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

export const bundleAnalyzer = new BundleAnalyzer();

// HOC to track component load times
export function withLoadTimeTracking<T extends React.ComponentType<any>>(
  Component: T,
  componentName: string
): T {
  const WrappedComponent = (props: React.ComponentProps<T>) => {
    const startTime = performance.now();
    
    React.useEffect(() => {
      bundleAnalyzer.trackComponentLoad(componentName, startTime);
    }, []);

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withLoadTimeTracking(${componentName})`;
  return WrappedComponent as T;
}

// Hook to track lazy component loading
export function useLazyLoadTracking(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      bundleAnalyzer.trackComponentLoad(componentName, startTime);
    };
  }, [componentName]);
}