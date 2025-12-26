'use client';

import { mutate } from 'swr';

// Cache configuration for different data types - optimized for performance
export const CACHE_CONFIG = {
  // Tickets - reduced polling frequency for better performance
  tickets: {
    refreshInterval: 0, // Disabled auto-refresh, use manual refresh
    revalidateOnFocus: false, // Disabled to prevent unnecessary fetches
    revalidateOnReconnect: true,
    dedupingInterval: 10000, // 10 seconds deduping
  },

  // Analytics - moderately changing data
  analytics: {
    refreshInterval: 0, // Disabled auto-refresh
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 120000, // 2 minutes deduping
  },
  
  // Knowledge base - rarely changing
  knowledgeBase: {
    refreshInterval: 0, // Disabled auto-refresh
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes deduping
  },
  
  // Users - static-like data
  users: {
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 600000, // 10 minutes
  },
  
  // User preferences and settings
  preferences: {
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 0,
  },
};

// Cache invalidation patterns
export class CacheManager {
  // Invalidate ticket-related caches
  static invalidateTicketCaches(ticketId?: string) {
    if (ticketId) {
      // Invalidate specific ticket
      mutate(`/api/tickets/${ticketId}`);
      mutate(`/api/tickets/${ticketId}/comments`);
      mutate(`/api/tickets/${ticketId}/history`);
      mutate(`/api/tickets/${ticketId}/followers`);
    }
    
    // Invalidate ticket lists
    mutate(key => typeof key === 'string' && key.startsWith('/api/tickets'), undefined, { revalidate: true });
    
    // Invalidate analytics that depend on tickets
    mutate(key => typeof key === 'string' && key.includes('/api/analytics'), undefined, { revalidate: true });
  }

  // Invalidate user-related caches
  static invalidateUserCaches(userId?: string) {
    if (userId) {
      mutate(`/api/users/${userId}`);
    }
    
    mutate(key => typeof key === 'string' && key.startsWith('/api/users'), undefined, { revalidate: true });
    
    // Invalidate tickets assigned to users
    mutate(key => typeof key === 'string' && key.startsWith('/api/tickets'), undefined, { revalidate: true });
  }

// Invalidate analytics caches
  static invalidateAnalyticsCaches() {
    mutate(key => typeof key === 'string' && key.includes('/api/analytics'), undefined, { revalidate: true });
  }

  // Invalidate knowledge base caches
  static invalidateKnowledgeBaseCaches() {
    mutate(key => typeof key === 'string' && key.startsWith('/api/knowledge-base'), undefined, { revalidate: true });
  }

  // Clear all caches (use sparingly)
  static clearAllCaches() {
    mutate(() => true, undefined, { revalidate: true });
  }

  // Preload critical data
  static async preloadCriticalData() {
    // Preload user data
    mutate('/api/auth/me');
    
    // Preload initial ticket list
    mutate('/api/tickets?page=1&limit=20');
  }
}

// Optimistic update helpers
export class OptimisticUpdates {
  // Optimistically update ticket status
  static updateTicketStatus(ticketId: string, newStatus: string) {
    const ticketKey = `/api/tickets/${ticketId}`;
    
    mutate(
      ticketKey,
      (currentData: any) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      },
      false // Don't revalidate immediately
    );

    // Also update in ticket lists
    mutate(
      key => typeof key === 'string' && key.startsWith('/api/tickets') && key.includes('page'),
      (currentData: any) => {
        if (!currentData?.data) return currentData;
        
        return {
          ...currentData,
          data: currentData.data.map((ticket: any) =>
            ticket.id === ticketId
              ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() }
              : ticket
          ),
        };
      },
      false
    );
  }

  // Optimistically update ticket assignment
  static updateTicketAssignment(ticketId: string, assigneeId: string, assigneeName: string) {
    const ticketKey = `/api/tickets/${ticketId}`;
    
    mutate(
      ticketKey,
      (currentData: any) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          assignedToId: assigneeId,
          assignedTo: { id: assigneeId, name: assigneeName },
          updatedAt: new Date().toISOString(),
        };
      },
      false
    );

    // Update in ticket lists
    mutate(
      key => typeof key === 'string' && key.startsWith('/api/tickets') && key.includes('page'),
      (currentData: any) => {
        if (!currentData?.data) return currentData;
        
        return {
          ...currentData,
          data: currentData.data.map((ticket: any) =>
            ticket.id === ticketId
              ? { 
                  ...ticket, 
                  assignedToId: assigneeId,
                  assignedTo: { id: assigneeId, name: assigneeName },
                  updatedAt: new Date().toISOString() 
                }
              : ticket
          ),
        };
      },
      false
    );
  }

  // Optimistically add comment
  static addComment(ticketId: string, comment: any) {
    const commentsKey = `/api/tickets/${ticketId}/comments`;
    
    mutate(
      commentsKey,
      (currentData: any) => {
        if (!currentData) return [comment];
        return [...currentData, comment];
      },
      false
    );
  }


}

// Cache warming strategies
export class CacheWarming {
  // Warm up caches based on user role
  static async warmCachesByRole(userRole: string) {
    switch (userRole) {
      case 'Admin_Manager':
        // Preload organization analytics
        mutate('/api/analytics/organization');
        mutate('/api/analytics/teams');
        mutate('/api/users');
        break;
        
      case 'Team_Leader':
        // Preload team analytics
        mutate('/api/analytics/teams/current');
        mutate('/api/users/team-members');
        break;
        
      case 'User_Employee':
        // Preload personal data
        mutate('/api/tickets?createdBy=me');
        mutate('/api/tickets?following=me');
        break;
    }
  }

  // Warm up caches based on current page
  static async warmCachesByPage(pageName: string) {
    switch (pageName) {
      case 'tickets':
        mutate('/api/tickets?page=1&limit=20');
        mutate('/api/tickets/stats');
        break;
        
      case 'analytics':
        mutate('/api/analytics/organization');
        mutate('/api/analytics/trends');
        break;
        
      case 'knowledge-base':
        mutate('/api/knowledge-base/articles?page=1');
        mutate('/api/knowledge-base/categories');
        break;
    }
  }
}

// Background cache refresh
export class BackgroundRefresh {
  private static intervals: Map<string, NodeJS.Timeout> = new Map();

  // Start background refresh for critical data
  static startBackgroundRefresh() {
    // Refresh ticket stats every 60 seconds
    this.intervals.set('ticket-stats', setInterval(() => {
      mutate('/api/tickets/stats');
    }, 60000));
  }

  // Stop all background refresh
  static stopBackgroundRefresh() {
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();
  }

  // Stop specific background refresh
  static stopSpecificRefresh(key: string) {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }
}

// Cache size management
export class CacheSize {
  // Get estimated cache size (development only)
  static getEstimatedCacheSize(): number {
    if (typeof window === 'undefined') return 0;
    
    try {
      // This is a rough estimation
      const cacheData = JSON.stringify(window);
      return new Blob([cacheData]).size;
    } catch {
      return 0;
    }
  }

  // Clear old cache entries
  static clearOldEntries() {
    // SWR handles this automatically, but we can force it
    mutate(() => false, undefined, { revalidate: false });
  }
}

// Performance monitoring for cache
export class CachePerformance {
  private static metrics: Map<string, { hits: number; misses: number; lastAccess: Date }> = new Map();

  static recordCacheHit(key: string) {
    const metric = this.metrics.get(key) || { hits: 0, misses: 0, lastAccess: new Date() };
    metric.hits++;
    metric.lastAccess = new Date();
    this.metrics.set(key, metric);
  }

  static recordCacheMiss(key: string) {
    const metric = this.metrics.get(key) || { hits: 0, misses: 0, lastAccess: new Date() };
    metric.misses++;
    metric.lastAccess = new Date();
    this.metrics.set(key, metric);
  }

  static getCacheMetrics() {
    return Array.from(this.metrics.entries()).map(([key, metric]) => ({
      key,
      hitRate: metric.hits / (metric.hits + metric.misses),
      totalRequests: metric.hits + metric.misses,
      lastAccess: metric.lastAccess,
    }));
  }

  static clearMetrics() {
    this.metrics.clear();
  }
}