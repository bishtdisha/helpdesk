'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';

export interface RecentSearch {
  id: string;
  name: string;
  filters: Record<string, any>;
  timestamp: number;
}

const MAX_RECENT_SEARCHES = 10;

export function useRecentSearches() {
  const { user } = useAuth();
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Get storage key for current user
  const getStorageKey = useCallback(() => {
    return user ? `recent_searches_${user.id}` : 'recent_searches_anonymous';
  }, [user]);

  // Load recent searches from localStorage
  const loadRecentSearches = useCallback(() => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const searches = JSON.parse(stored) as RecentSearch[];
        // Sort by timestamp (most recent first)
        const sortedSearches = searches.sort((a, b) => b.timestamp - a.timestamp);
        setRecentSearches(sortedSearches.slice(0, MAX_RECENT_SEARCHES));
      } else {
        setRecentSearches([]);
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
      setRecentSearches([]);
    }
  }, [getStorageKey]);

  // Save recent searches to localStorage
  const saveRecentSearches = useCallback((searches: RecentSearch[]) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(searches));
    } catch (error) {
      console.error('Failed to save recent searches:', error);
    }
  }, [getStorageKey]);

  // Load searches when user changes or component mounts
  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  // Add a new recent search
  const addRecentSearch = useCallback((name: string, filters: Record<string, any>) => {
    const newSearch: RecentSearch = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      filters,
      timestamp: Date.now(),
    };

    setRecentSearches(prev => {
      // Remove any existing search with the same filters
      const filtered = prev.filter(search => 
        JSON.stringify(search.filters) !== JSON.stringify(filters)
      );
      
      // Add new search at the beginning
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      // Save to localStorage
      saveRecentSearches(updated);
      
      return updated;
    });
  }, [saveRecentSearches]);

  // Remove a recent search
  const removeRecentSearch = useCallback((searchId: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(search => search.id !== searchId);
      saveRecentSearches(updated);
      return updated;
    });
  }, [saveRecentSearches]);

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(getStorageKey());
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, [getStorageKey]);

  // Generate a name for a search based on its filters
  const generateSearchName = useCallback((filters: Record<string, any>): string => {
    const parts: string[] = [];

    if (filters.search) {
      parts.push(`"${filters.search}"`);
    }

    if (filters.ticketId) {
      parts.push(`ID: ${filters.ticketId}`);
    }

    if (filters.customer) {
      parts.push(`Customer: ${filters.customer.name}`);
    }

    if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
      parts.push(`Status: ${filters.status.join(', ')}`);
    }

    if (filters.priority && Array.isArray(filters.priority) && filters.priority.length > 0) {
      parts.push(`Priority: ${filters.priority.join(', ')}`);
    }

    if (filters.teamId) {
      parts.push(`Team: ${filters.teamId}`);
    }

    if (filters.assignedTo) {
      parts.push(`Assigned: ${filters.assignedTo}`);
    }

    if (filters.createdAfter || filters.createdBefore) {
      const dateRange = [];
      if (filters.createdAfter) {
        dateRange.push(`from ${new Date(filters.createdAfter).toLocaleDateString()}`);
      }
      if (filters.createdBefore) {
        dateRange.push(`to ${new Date(filters.createdBefore).toLocaleDateString()}`);
      }
      parts.push(`Created: ${dateRange.join(' ')}`);
    }

    if (filters.updatedAfter || filters.updatedBefore) {
      const dateRange = [];
      if (filters.updatedAfter) {
        dateRange.push(`from ${new Date(filters.updatedAfter).toLocaleDateString()}`);
      }
      if (filters.updatedBefore) {
        dateRange.push(`to ${new Date(filters.updatedBefore).toLocaleDateString()}`);
      }
      parts.push(`Updated: ${dateRange.join(' ')}`);
    }

    if (filters.resolvedAfter || filters.resolvedBefore) {
      const dateRange = [];
      if (filters.resolvedAfter) {
        dateRange.push(`from ${new Date(filters.resolvedAfter).toLocaleDateString()}`);
      }
      if (filters.resolvedBefore) {
        dateRange.push(`to ${new Date(filters.resolvedBefore).toLocaleDateString()}`);
      }
      parts.push(`Resolved: ${dateRange.join(' ')}`);
    }

    if (parts.length === 0) {
      return 'All tickets';
    }

    return parts.join(' • ');
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    generateSearchName,
  };
}