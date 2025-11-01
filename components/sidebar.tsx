"use client"

import { RoleBasedNavigation } from "@/components/rbac/role-based-navigation"

interface SidebarProps {
  activeModule: string
  onModuleChange: (module: string) => void
}

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  return <RoleBasedNavigation activeModule={activeModule} onModuleChange={onModuleChange} />
}
