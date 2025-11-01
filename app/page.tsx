"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { Tickets } from "@/components/tickets"
import { Customers } from "@/components/customers"
import { Reports } from "@/components/reports"
import { KnowledgeBase } from "@/components/knowledge-base"
import { Settings } from "@/components/settings"
import { NavigationHeader } from "@/components/navigation-header"
import { useAuth } from "@/lib/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogIn, UserPlus, BookOpen } from "lucide-react"

export default function HelpdeskApp() {
  const [activeModule, setActiveModule] = useState("dashboard")
  const { isAuthenticated, isLoading } = useAuth()

  const getModuleTitle = (module: string) => {
    switch (module) {
      case "dashboard":
        return isAuthenticated ? "Dashboard" : "Welcome"
      case "tickets":
        return "Tickets"
      case "teams":
        return "Teams"
      case "reports":
        return "Reports"
      case "knowledge-base":
        return "Knowledge Base"
      case "settings":
        return "Settings"
      default:
        return isAuthenticated ? "Dashboard" : "Welcome"
    }
  }

  const renderActiveModule = () => {
    // For unauthenticated users, show limited content
    if (!isAuthenticated && !isLoading) {
      switch (activeModule) {
        case "dashboard":
          return (
            <div className="space-y-6">
              {/* Welcome Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl">Welcome to Odoo Helpdesk</CardTitle>
                  <CardDescription className="text-lg">
                    Your comprehensive customer support platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Get Started</h3>
                      <p className="text-muted-foreground mb-4">
                        Sign in to access your dashboard, manage tickets, and collaborate with your team.
                      </p>
                      <div className="space-y-2">
                        <Button asChild className="w-full">
                          <Link href="/login" className="flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            Sign In to Your Account
                          </Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                          <Link href="/register" className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Create New Account
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Features</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• Ticket management and tracking</li>
                        <li>• Team collaboration tools</li>
                        <li>• Knowledge base access</li>
                        <li>• Reporting and analytics</li>
                        <li>• Customer management</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Public Knowledge Base Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Knowledge Base
                  </CardTitle>
                  <CardDescription>
                    Browse our public knowledge base for helpful articles and guides
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveModule("knowledge-base")}
                    className="w-full sm:w-auto"
                  >
                    Browse Knowledge Base
                  </Button>
                </CardContent>
              </Card>
            </div>
          )
        case "knowledge-base":
          return <KnowledgeBase />
        default:
          return (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">Access Restricted</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to access this feature.
              </p>
              <div className="space-x-4">
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/register">Create Account</Link>
                </Button>
              </div>
            </div>
          )
      }
    }

    // For authenticated users, show full functionality
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
        <NavigationHeader title={getModuleTitle(activeModule)} />
        <main className="flex-1 overflow-auto p-6">{renderActiveModule()}</main>
      </div>
    </div>
  )
}
