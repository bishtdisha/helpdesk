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
    await logout()
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 h-auto p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm">
                        {getUserInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{user.name || 'User'}</p>
                        <UserRoleBadge roleId={user.roleId} />
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* User Management - Only show if user has permission */}
                  <ActionButton
                    action={PERMISSION_ACTIONS.READ}
                    resource={RESOURCE_TYPES.USERS}
                    variant="ghost"
                    className="w-full justify-start h-auto p-0"
                  >
                    <DropdownMenuItem asChild>
                      <Link href="/users" className="flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        User Management
                      </Link>
                    </DropdownMenuItem>
                  </ActionButton>

                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
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