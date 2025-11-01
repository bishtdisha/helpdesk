"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogOut, User, LogIn, UserPlus, Settings, UserCog } from "lucide-react"
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
      await logout()
      // The logout function in useAuth should handle the redirect
      // but we can add a fallback redirect here
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect even if logout fails
      window.location.href = '/login'
    }
  }

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
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
            <div className="flex items-center gap-3">
              {/* User initials and role badge - matching the design */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-0 h-auto p-1 hover:bg-accent rounded-full">
                      <Avatar className="h-8 w-8 cursor-pointer">
                        <AvatarFallback className="text-sm font-semibold bg-primary text-primary-foreground">
                          {getUserInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="pb-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Role badge displayed next to initials */}
                <UserRoleBadge roleName={user.role?.name} />
              </div>
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