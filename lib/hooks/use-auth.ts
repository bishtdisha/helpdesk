"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SafeUser } from '@/lib/types/auth';

interface AuthState {
  user: SafeUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const router = useRouter();

  // Check authentication status
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setAuthState({
          user: userData.user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    logout,
    refreshAuth: checkAuth,
  };
}