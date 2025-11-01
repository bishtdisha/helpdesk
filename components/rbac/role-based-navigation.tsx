"use client"

import Link from "next/link"
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
  Shield
} from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { PermissionGate } from "./permission-gate"
import { PERMISSION_ACTIONS, RESOURCE_TYPES, ROLE_TYPES } from "@/lib/rbac/permissions"

interface RoleBasedNavigationProps {
  activeModule: string
  onModuleChange: (module: string) => void
}

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  action?: string
  resource?: string
  requireRole?: string
  public?: boolean
}

const menuItems: MenuItem[] = [
  // Public items (available to all users)
  { 
    id: "dashboard", 
    label: "Dashboard", 
    icon: LayoutDashboard,
    public: true
  },
  { 
    id: "tickets", 
    label: "Tickets", 
    icon: Ticket,
    action: PERMISSION_ACTIONS.READ,
    resource: RESOURCE_TYPES.TICKETS
  },
  { 
    id: "knowledge-base", 
    label: "Knowledge Base", 
    icon: BookOpen,
    action: PERMISSION_ACTIONS.READ,
    resource: RESOURCE_TYPES.KNOWLEDGE_BASE
  },
  
  // User Management - Admin/Manager ONLY
  { 
    id: "users", 
    label: "User Management", 
    icon: UserCog,
    requireRole: ROLE_TYPES.ADMIN_MANAGER
  },
  
  // Team Management - Admin/Manager access
  { 
    id: "teams", 
    label: "Team Management", 
    icon: Users,
    action: PERMISSION_ACTIONS.READ,
    resource: RESOURCE_TYPES.TEAMS
  },
  
  // Reports/Analytics - Role-based access
  { 
    id: "reports", 
    label: "Reports", 
    icon: BarChart3,
    action: PERMISSION_ACTIONS.READ,
    resource: RESOURCE_TYPES.ANALYTICS
  },
  
  // Admin-only features
  { 
    id: "audit-logs", 
    label: "Audit Logs", 
    icon: Shield,
    action: PERMISSION_ACTIONS.READ,
    resource: RESOURCE_TYPES.AUDIT_LOGS
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

export function RoleBasedNavigation({ activeModule, onModuleChange }: RoleBasedNavigationProps) {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h2 className="text-xl font-bold text-sidebar-foreground">Odoo Helpdesk</h2>
        </div>
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-sidebar-accent rounded-lg animate-pulse" />
            ))}
          </div>
        </nav>
      </div>
    )
  }

  // Choose menu items based on authentication state
  const itemsToRender = isAuthenticated ? menuItems : publicMenuItems

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-xl font-bold text-sidebar-foreground">Odoo Helpdesk</h2>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {itemsToRender.map((item) => {
            const Icon = item.icon
            
            // For public items or when not authenticated, render directly
            if (item.public || !isAuthenticated) {
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onModuleChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      activeModule === item.id
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              )
            }

            // For protected items, use PermissionGate
            return (
              <PermissionGate
                key={item.id}
                action={item.action || 'read'}
                resource={item.resource || 'default'}
                requireRole={item.requireRole as any}
              >
                <li>
                  <button
                    onClick={() => onModuleChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      activeModule === item.id
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              </PermissionGate>
            )
          })}
        </ul>
      </nav>

      {/* Authentication actions for unauthenticated users */}
      {!isLoading && !isAuthenticated && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start" asChild>
              <Link href="/login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </Button>
            <Button size="sm" className="w-full justify-start" asChild>
              <Link href="/register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Sign Up
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}