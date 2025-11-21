"use client"

import { RoleBasedNavigation } from "@/components/rbac/role-based-navigation"

interface SidebarProps {
  activeModule: string
  onModuleChange: (module: string) => void
  isOpen?: boolean
  onToggle?: () => void
}

export function Sidebar({ activeModule, onModuleChange, isOpen = false, onToggle }: SidebarProps) {
  return (
    <RoleBasedNavigation 
      activeModule={activeModule} 
      onModuleChange={onModuleChange}
      isOpen={isOpen}
      onToggle={onToggle}
    />
  )
}
