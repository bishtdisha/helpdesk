'use client';

import { useEffect } from 'react';
import { performanceMonitor, PerformanceDebugger } from '@/lib/performance/monitoring';
import { BackgroundRefresh, CacheWarming } from '@/lib/performance/caching';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  const { user, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Start background cache refresh
    BackgroundRefresh.startBackgroundRefresh();

    // Warm up caches based on user role
    if (role) {
      CacheWarming.warmCachesByRole(role);
    }

    // Cleanup on unmount
    return () => {
      BackgroundRefresh.stopBackgroundRefresh();
      performanceMonitor.cleanup();
    };
  }, [role]);

  // Warm up caches when route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const pageName = url.split('/').pop() || 'dashboard';
      CacheWarming.warmCachesByPage(pageName);
    };

    // Listen for route changes (Next.js specific)
    if (typeof window !== 'undefined') {
      const originalPushState = window.history.pushState;
      window.history.pushState = function(...args) {
        originalPushState.apply(window.history, args);
        handleRouteChange(args[2] as string);
      };

      const originalReplaceState = window.history.replaceState;
      window.history.replaceState = function(...args) {
        originalReplaceState.apply(window.history, args);
        handleRouteChange(args[2] as string);
      };

      return () => {
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
      };
    }
  }, []);

  return (
    <>
      {children}
      <PerformanceDebugger />
    </>
  );
}