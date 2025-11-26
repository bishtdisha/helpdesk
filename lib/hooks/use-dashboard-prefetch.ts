'use client';

import { useEffect } from 'react';

/**
 * Prefetch dashboard data on hover/focus for instant navigation
 * This makes the dashboard feel instant when users navigate to it
 */
export function useDashboardPrefetch() {
  useEffect(() => {
    // Prefetch dashboard APIs when component mounts
    const prefetchUrls = [
      '/api/dashboard/stats',
      '/api/dashboard/activity',
      '/api/dashboard/status-distribution',
      '/api/dashboard/recent-activity',
    ];

    // Use requestIdleCallback for non-blocking prefetch
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        prefetchUrls.forEach(url => {
          fetch(url, { method: 'GET' }).catch(() => {
            // Silent fail - prefetch is optional
          });
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        prefetchUrls.forEach(url => {
          fetch(url, { method: 'GET' }).catch(() => {});
        });
      }, 100);
    }
  }, []);
}

/**
 * Prefetch dashboard data on link hover
 * Use this on navigation links to the dashboard
 */
export function prefetchDashboard() {
  const urls = [
    '/api/dashboard/stats',
    '/api/dashboard/activity',
    '/api/dashboard/status-distribution',
    '/api/dashboard/recent-activity',
  ];

  urls.forEach(url => {
    fetch(url, { method: 'GET' }).catch(() => {});
  });
}
