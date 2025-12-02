"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  BarChart3, 
  BookOpen, 
  Settings, 
  LogIn, 
  UserPlus, 
  Home,
  UserCog,
  Shield,
  Clock,
  Menu,
  Plus,
  Crown
} from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePermissions } from "@/lib/hooks/use-permissions"
import { Button } from "@/components/ui/button"
import { PermissionGate } from "./permission-gate"
import { PERMISSION_ACTIONS, RESOURCE_TYPES, ROLE_TYPES } from "@/lib/rbac/permissions"
import type { RoleType } from "@/lib/types/rbac"

interface RoleBasedNavigationProps {
  activeModule: string
  onModuleChange: (module: string) => void
  isOpen?: boolean
  onToggle?: () => void
}

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  action?: string
  resource?: string
  requireRole?: RoleType
  excludeRoles?: RoleType[]
  public?: boolean
}

/**
 * Menu items configuration with role-based visibility
 * Requirements: 18.1, 18.2, 18.3
 */
const menuItems: MenuItem[] = [
  // Dashboard - available to all authenticated users
  { 
    id: "dashboard", 
    label: "Dashboard", 
    icon: LayoutDashboard,
    public: true
  },
  
  // Tickets - available to all roles (with different access levels)
  { 
    id: "tickets", 
    label: "Tickets", 
    icon: Ticket,
    action: PERMISSION_ACTIONS.READ,
    resource: RESOURCE_TYPES.TICKETS
  },
  
  // Knowledge Base - available to all roles (read-only for User/Employee)
  { 
    id: "knowledge-base", 
    label: "Knowledge Base", 
    icon: BookOpen,
    action: PERMISSION_ACTIONS.READ,
    resource: RESOURCE_TYPES.KNOWLEDGE_BASE
  },
  
  // Analytics - Admin and Team Leader only (Requirement 18.2, 18.3)
  { 
    id: "analytics", 
    label: "Analytics", 
    icon: BarChart3,
    action: PERMISSION_ACTIONS.READ,
    resource: RESOURCE_TYPES.ANALYTICS,
    excludeRoles: [ROLE_TYPES.USER_EMPLOYEE]
  },
  
  // User Management - Admin/Manager and Team Leader
  { 
    id: "users", 
    label: "User Management", 
    icon: UserCog,
    action: PERMISSION_ACTIONS.READ,
    resource: RESOURCE_TYPES.USERS,
    excludeRoles: [ROLE_TYPES.USER_EMPLOYEE]
  },
  
  // Team Management - Admin/Manager and Team Leader (Requirement 18.3)
  { 
    id: "teams", 
    label: "Team Management", 
    icon: Users,
    action: PERMISSION_ACTIONS.READ,
    resource: RESOURCE_TYPES.TEAMS,
    excludeRoles: [ROLE_TYPES.USER_EMPLOYEE]
  },
  
  // SLA Management - Admin/Manager ONLY
  { 
    id: "sla", 
    label: "SLA Management", 
    icon: Clock,
    requireRole: ROLE_TYPES.ADMIN_MANAGER
  },
  
  // Settings - available to all authenticated users
  { 
    id: "settings", 
    label: "Settings", 
    icon: Settings,
    public: true
  },
]

const publicMenuItems = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "knowledge-base", label: "Knowledge Base", icon: BookOpen },
]

/**
 * Helper function to check if user should see a menu item
 * Requirements: 18.1, 18.2, 18.3
 */
function shouldShowMenuItem(item: MenuItem, userRole: RoleType | null): boolean {
  // Public items are always shown
  if (item.public) return true
  
  // If no user role, don't show protected items
  if (!userRole) return false
  
  // Check if role is explicitly excluded
  if (item.excludeRoles && item.excludeRoles.includes(userRole)) {
    return false
  }
  
  // Check if specific role is required
  if (item.requireRole && userRole !== item.requireRole) {
    return false
  }
  
  return true
}

/**
 * Get user role from auth context
 */
function getUserRole(user: any): RoleType | null {
  if (!user?.role?.name) return null
  return user.role.name as RoleType
}

export function RoleBasedNavigation({ activeModule, onModuleChange, isOpen = true, onToggle }: RoleBasedNavigationProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const permissions = usePermissions()

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        "fixed lg:static inset-y-0 left-0 z-50",
        isOpen ? "w-64" : "w-16",
        "translate-x-0"
      )}>
        <div className="px-3 py-3 border-b border-sidebar-border flex items-center justify-between h-[56px]">
          {isOpen && (
            <h2 className="text-xl font-bold text-sidebar-foreground">
              Helpdesk
            </h2>
          )}
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={cn(
                "bg-sidebar-accent rounded-lg animate-pulse",
                isOpen ? "h-12" : "h-10 w-10 mx-auto"
              )} />
            ))}
          </div>
        </nav>
      </div>
    )
  }

  // Get user role for filtering
  const userRole = isAuthenticated ? getUserRole(user) : null
  
  // Choose menu items based on authentication state
  const itemsToRender = isAuthenticated ? menuItems : publicMenuItems
  
  // Filter items based on user role (Requirements: 18.1, 18.2, 18.3)
  const visibleItems = itemsToRender.filter(item => 
    !isAuthenticated || shouldShowMenuItem(item, userRole)
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
        "fixed lg:static inset-y-0 left-0 z-50",
        isOpen ? "w-64" : "w-16",
        "translate-x-0"
      )}>
        <div className="px-3 py-3 border-b border-sidebar-border flex items-center justify-between h-[56px]">
          {isOpen && (
            <h2 className="text-xl font-bold text-sidebar-foreground">
              Helpdesk
            </h2>
          )}
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 flex-shrink-0"
              aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon
            
            // For public items or when not authenticated, render directly
            if (item.public || !isAuthenticated) {
              const href = item.id === 'dashboard' ? '/helpdesk/dashboard' : `/helpdesk/${item.id}`
              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg text-left transition-colors",
                      isOpen ? "px-4 py-3" : "px-2 py-3 justify-center",
                      activeModule === item.id
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    title={!isOpen ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isOpen && <span className="font-medium">{item.label}</span>}
                  </Link>
                </li>
              )
            }

            // For protected items, use PermissionGate for additional validation
            const href = item.id === 'dashboard' ? '/helpdesk/dashboard' : `/helpdesk/${item.id}`
            return (
              <PermissionGate
                key={item.id}
                action={item.action || 'read'}
                resource={item.resource || 'default'}
                requireRole={item.requireRole}
              >
                <li>
                  <Link
                    href={href}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg text-left transition-colors",
                      isOpen ? "px-4 py-3" : "px-2 py-3 justify-center",
                      activeModule === item.id
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    title={!isOpen ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isOpen && <span className="font-medium">{item.label}</span>}
                  </Link>
                </li>
              </PermissionGate>
            )
          })}
        </ul>
        
        {/* My Team Quick Access - for team leaders */}
        {!isLoading && isAuthenticated && user?.teamLeaderships && user.teamLeaderships.length > 0 && (
          <div className="mt-auto px-4 pb-2">
            <div className={cn(
              "rounded-lg bg-amber-100/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800",
              isOpen ? "p-3" : "p-2"
            )}>
              {isOpen ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <Crown className="h-3 w-3" />
                    <span>MY TEAM{user.teamLeaderships.length > 1 ? 'S' : ''}</span>
                  </div>
                  {user.teamLeaderships.map((leadership: any) => (
                    <Link
                      key={leadership.team.id}
                      href="/helpdesk/teams"
                      className="w-full text-left text-sm text-amber-900 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-200 transition-colors block"
                    >
                      {leadership.team.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  href="/helpdesk/teams"
                  className="w-full flex justify-center"
                  title="My Team"
                >
                  <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* New Ticket Quick Action - for authenticated users with permission */}
      {!isLoading && isAuthenticated && permissions.canCreateTicket() && (
        <div className="px-4 pb-4 border-t border-sidebar-border pt-4">
          <Link href="/helpdesk/tickets/new">
            <Button
              className={cn(
                "w-full flex items-center gap-2 justify-center",
                !isOpen && "px-2"
              )}
              size={isOpen ? "default" : "icon"}
              title={!isOpen ? "New Ticket" : undefined}
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              {isOpen && <span>New Ticket</span>}
            </Button>
          </Link>
        </div>
      )}

      {/* Authentication actions for unauthenticated users */}
      {!isLoading && !isAuthenticated && (
        <div className="p-2 border-t border-sidebar-border">
          <div className="space-y-2">
            {isOpen ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start" 
                  asChild
                >
                  <Link href="/login" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4 flex-shrink-0" />
                    <span>Sign In</span>
                  </Link>
                </Button>
                <Button 
                  size="sm" 
                  className="w-full justify-start" 
                  asChild
                >
                  <Link href="/register" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 flex-shrink-0" />
                    <span>Sign Up</span>
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-full" 
                  asChild
                  title="Sign In"
                >
                  <Link href="/login">
                    <LogIn className="h-4 w-4" />
                  </Link>
                </Button>
                <Button 
                  size="icon" 
                  className="w-full" 
                  asChild
                  title="Sign Up"
                >
                  <Link href="/register">
                    <UserPlus className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  )
}