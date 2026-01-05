"use client"

import { useState, useMemo, Suspense } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { NavigationHeader } from "@/components/layout/navigation-header"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"

// Lightweight skeleton for initial render
function LayoutSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="px-3 py-3 border-b border-sidebar-border h-[56px]">
          <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        </div>
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </nav>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="h-[56px] border-b bg-background px-6 flex items-center">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div className="space-y-4">
            <div className="h-32 bg-muted animate-pulse rounded-lg" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        </main>
      </div>
    </div>
  )
}

export function HelpdeskClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const { isLoading, user } = useAuth()

  // Memoize active module calculation
  const activeModule = useMemo(() => {
    if (pathname === "/helpdesk" || pathname === "/helpdesk/dashboard") return "dashboard"
    if (pathname?.startsWith("/helpdesk/tickets")) return "tickets"
    if (pathname?.startsWith("/helpdesk/reports")) return "reports"
    if (pathname?.startsWith("/helpdesk/analytics")) return "analytics"
    if (pathname?.startsWith("/helpdesk/knowledge-base")) return "knowledge-base"
    if (pathname?.startsWith("/helpdesk/users")) return "users"
    if (pathname?.startsWith("/helpdesk/teams")) return "teams"
    if (pathname?.startsWith("/helpdesk/settings")) return "settings"
    return "dashboard"
  }, [pathname])

  const moduleTitle = useMemo(() => {
    switch (activeModule) {
      case "dashboard": return "Dashboard"
      case "tickets": return "Tickets"
      case "reports": return "Reports"
      case "teams": return "Team Management"
      case "users": return "User Management"
      case "analytics": return "Analytics"
      case "knowledge-base": return "Knowledge Base"
      case "settings": return "Settings"
      default: return "Helpdesk"
    }
  }, [activeModule])

  // Show skeleton while loading - much faster than full loading screen
  if (isLoading && !user) {
    return <LayoutSkeleton />
  }

  // If no user after loading, show skeleton (middleware will redirect)
  if (!isLoading && !user) {
    return <LayoutSkeleton />
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeModule={activeModule}
        onModuleChange={() => {}}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex flex-col min-h-0">
        <NavigationHeader title={moduleTitle} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <Suspense fallback={
            <div className="space-y-4">
              <div className="h-32 bg-muted animate-pulse rounded-lg" />
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}
