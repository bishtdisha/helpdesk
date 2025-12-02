"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { NavigationHeader } from "@/components/navigation-header"
import { usePathname } from "next/navigation"

export default function HelpdeskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  // Determine active module from pathname
  const getActiveModule = () => {
    if (pathname === '/helpdesk' || pathname === '/helpdesk/dashboard') return 'dashboard'
    if (pathname?.startsWith('/helpdesk/tickets')) return 'tickets'
    if (pathname?.startsWith('/helpdesk/analytics')) return 'analytics'
    if (pathname?.startsWith('/helpdesk/knowledge-base')) return 'knowledge-base'
    if (pathname?.startsWith('/helpdesk/users')) return 'users'
    if (pathname?.startsWith('/helpdesk/teams')) return 'teams'
    if (pathname?.startsWith('/helpdesk/settings')) return 'settings'
    return 'dashboard'
  }

  const getModuleTitle = (module: string) => {
    switch (module) {
      case "dashboard": return "Dashboard"
      case "tickets": return "Tickets"
      case "teams": return "Team Management"
      case "users": return "User Management"
      case "analytics": return "Analytics"
      case "knowledge-base": return "Knowledge Base"
      case "settings": return "Settings"
      default: return "Helpdesk"
    }
  }

  const activeModule = getActiveModule()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        activeModule={activeModule} 
        onModuleChange={() => {}} // Not needed with route-based navigation
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <NavigationHeader title={getModuleTitle(activeModule)} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
