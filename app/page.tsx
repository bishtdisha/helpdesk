"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { Tickets } from "@/components/tickets"
import { Customers } from "@/components/customers"
import { Reports } from "@/components/reports"
import { KnowledgeBase } from "@/components/knowledge-base"
import { Settings } from "@/components/settings"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HelpdeskApp() {
  const [activeModule, setActiveModule] = useState("dashboard")

  const renderActiveModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard />
      case "tickets":
        return <Tickets />
      case "teams":
        return <Customers />
      case "reports":
        return <Reports />
      case "knowledge-base":
        return <KnowledgeBase />
      case "settings":
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            {activeModule.charAt(0).toUpperCase() + activeModule.slice(1).replace("-", " ")}
          </h1>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto p-6">{renderActiveModule()}</main>
      </div>
    </div>
  )
}
