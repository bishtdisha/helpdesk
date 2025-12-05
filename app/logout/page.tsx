"use client"

import { useEffect } from "react"
import { LoadingScreen } from "@/components/loading-screen"

export default function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      try {
        // Call logout API to invalidate server session
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        })
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        // Clear ALL storage
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (e) {
          console.error('Error clearing storage:', e)
        }
        
        // Clear all cookies (client-side accessible)
        try {
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        } catch (e) {
          console.error('Error clearing cookies:', e)
        }
        
        // Clear browser cache
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          });
        }
        
        // Force hard reload to login (clears all in-memory state)
        window.location.href = '/login'
      }
    }

    performLogout()
  }, [])

  return <LoadingScreen message="Logging out" submessage="Clearing all data..." />
}
