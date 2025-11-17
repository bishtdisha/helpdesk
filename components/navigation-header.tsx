"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBadge } from "@/components/notifications/notification-badge"
import { HelpSidebar } from "@/components/help-sidebar"
import { LogOut, User, LogIn, UserPlus, Settings, UserCog, HelpCircle } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { UserRoleBadge } from "@/components/rbac/user-role-badge"
import { ActionButton } from "@/components/rbac/action-button"
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from "@/lib/rbac/permissions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavigationHeaderProps {
  title: string
}

export function NavigationHeader({ title }: NavigationHeaderProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  // Get user initials for avatar
  const getUserInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return 'U'
  }

  const handleLogout = async () => {
    try {
      // Call the logout function from useAuth hook
      await logout()
      
      // Clear any local storage or session storage if needed
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // The logout function should handle the redirect, but add fallback
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }, 100)
    } catch (error) {
      console.error('Logout error:', error)
      
      // Force redirect even if logout fails
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/login'
      }
    }
  }

  return (
    <header id="navigation" className="bg-card border-b border-border px-6 py-4 flex items-center justify-between" role="banner">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      
      <div className="flex items-center gap-4">
        {isLoading ? (
          // Loading state
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
            <div className="hidden sm:block">
              <div className="h-4 w-20 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ) : isAuthenticated && user ? (
          // Authenticated user
          <>
            <NotificationBadge />
            
            <HelpSidebar>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2" 
                data-tour="help-button"
                aria-label="Open help documentation"
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Help</span>
              </Button>
            </HelpSidebar>
            
            <div className="flex items-center gap-3">
              {/* Profile button with initials and role - Clean Layout */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50 rounded-lg transition-all duration-200 cursor-pointer border border-transparent hover:border-border/30"
                    aria-label={`User menu for ${user.name || user.email} (${user.role?.name || 'User'})`}
                  >
                    {/* User initials circle */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-600 text-white font-semibold text-sm shadow-sm">
                      {getUserInitials(user.name, user.email)}
                    </div>
                    
                    {/* Role text with proper spacing */}
                    <span className="text-base font-medium text-foreground tracking-wide">
                      {user.role?.name === 'Admin/Manager' ? 'Admin' : 
                       user.role?.name === 'Team Leader' ? 'Leader' : 
                       user.role?.name === 'User/Employee' ? 'Employee' : 
                       user.role?.name || 'User'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-72 shadow-xl bg-white dark:bg-slate-800 border border-border/50 rounded-lg p-2"
                  sideOffset={8}
                >
                  {/* User Info Section */}
                  <div className="px-3 py-4 border-b border-border/30">
                    <div className="flex flex-col space-y-2">
                      <p className="text-base font-semibold text-foreground leading-none">
                        {user.name || 'User'}
                      </p>
                      <p className="text-sm text-muted-foreground leading-none">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  {/* Logout Section */}
                  <div className="pt-2">
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="flex items-center gap-3 px-3 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer rounded-md transition-colors"
                      aria-label="Sign out of your account"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      <span className="font-medium">Log out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ThemeToggle />
          </>
        ) : (
          // Unauthenticated user
          <>
            <ThemeToggle />
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              </Button>
              
              <Button size="sm" asChild>
                <Link href="/register" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}