'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Types
export type UserRole = 'Admin/Manager' | 'Team Leader' | 'User/Employee';

export interface User {
  id: string;
  email: string;
  name: string | null;
  roleId: string | null;
  teamId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  role?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session cache key
const SESSION_CACHE_KEY = 'cached_user_session';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const router = useRouter();

  // Load cached user data
  const loadCachedUser = useCallback(() => {
    try {
      const cached = localStorage.getItem(SESSION_CACHE_KEY);
      if (cached) {
        const { user: cachedUser, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        // Use cache if less than 5 minutes old
        if (age < CACHE_DURATION) {
          setUser(cachedUser);
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading cached user:', error);
    }
    return false;
  }, []);

  // Save user to cache
  const cacheUser = useCallback((userData: User | null) => {
    try {
      if (userData) {
        localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({
          user: userData,
          timestamp: Date.now()
        }));
      } else {
        localStorage.removeItem(SESSION_CACHE_KEY);
      }
    } catch (error) {
      console.error('Error caching user:', error);
    }
  }, []);

  // Fetch user data from API (non-blocking)
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        cacheUser(data.user);
      } else if (response.status === 401) {
        // Not authenticated
        setUser(null);
        cacheUser(null);
      } else {
        console.error('Failed to fetch user:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }, [cacheUser]);

  // Load cached user immediately, only fetch if needed
  useEffect(() => {
    // Try to load from cache first (instant, synchronous)
    const hasCached = loadCachedUser();

    // Stop loading immediately - UI renders instantly
    setIsLoading(false);

    if (hasCached) {
      // Cache hit - validate in background after delay
      const validationTimer = setTimeout(() => {
        fetchUser().catch(() => {});
      }, 3000); // 3 seconds delay for background validation

      return () => clearTimeout(validationTimer);
    } else {
      // No cache - fetch in background (non-blocking)
      fetchUser().catch(() => {});
    }
  }, [loadCachedUser, fetchUser]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      // CRITICAL: Clear ALL cached data before login
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setIsLoading(true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Fetch fresh user data after successful login
        await fetchUser();
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return {
          success: false,
          error: data.error || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return {
        success: false,
        error: 'An error occurred during login',
      };
    }
  }, [fetchUser]);

  // Logout function - completely clear all user data
  const logout = useCallback(async () => {
    try {
      // Call logout API to invalidate server session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 1. Clear React state immediately
      setUser(null);
      setIsLoading(false);

      // 2. Clear all localStorage (including cached user data)
      try {
        localStorage.clear();
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }

      // 3. Clear all sessionStorage
      try {
        sessionStorage.clear();
      } catch (e) {
        console.error('Error clearing sessionStorage:', e);
      }

      // 4. Clear all cookies (client-side accessible ones)
      try {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      } catch (e) {
        console.error('Error clearing cookies:', e);
      }

      // 5. Clear browser cache for this origin (if supported)
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }

      // 6. Force hard reload to login page (clears all in-memory state)
      window.location.href = '/login';
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  // Compute role from user data
  const role: UserRole | null = user?.role?.name as UserRole || null;

  const value: AuthContextType = {
    user,
    role,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
