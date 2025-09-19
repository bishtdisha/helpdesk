"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Plus, AlertCircle, CheckCircle, Clock, Users } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface DashboardStats {
  ticketStats: {
    total: number
    new: number
    open: number
    pending: number
    resolved: number
    closed: number
  }
  customerStats: {
    total: number
    active: number
    new_this_month: number
  }
  recentActivity: Array<{
    id: string
    subject: string
    status: string
    priority: string
    customer_name: string
    assigned_user_name: string
    updated_at: string
  }>
  userRole: string
  userName: string
}

export function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/dashboard/stats", {
        headers: {
          "x-user-id": user?.id || "550e8400-e29b-41d4-a716-446655440004", // Demo user ID
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats")
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Dashboard stats error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchDashboardStats}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const statusData = [
    { name: "New", value: stats.ticketStats.new, color: "hsl(var(--chart-1))" },
    { name: "Open", value: stats.ticketStats.open, color: "hsl(var(--chart-2))" },
    { name: "Pending", value: stats.ticketStats.pending, color: "hsl(var(--chart-3))" },
    { name: "Resolved", value: stats.ticketStats.resolved, color: "hsl(var(--chart-4))" },
  ]

  // Mock weekly data for now - in a real app, this would come from the API
  const ticketData = [
    { name: "Mon", open: 12, resolved: 8 },
    { name: "Tue", open: 15, resolved: 12 },
    { name: "Wed", open: 8, resolved: 14 },
    { name: "Thu", open: 18, resolved: 10 },
    { name: "Fri", open: 22, resolved: 16 },
    { name: "Sat", open: 5, resolved: 8 },
    { name: "Sun", open: 3, resolved: 6 },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {stats.userName}!</h1>
          <p className="text-muted-foreground">Here's what's happening with your helpdesk today.</p>
        </div>
        <Badge variant="outline" className="capitalize">
          {stats.userRole}
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
        <Button variant="outline">View All Tickets</Button>
        <Button variant="outline">Customer Portal</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ticketStats.open + stats.ticketStats.new}</div>
            <p className="text-xs text-muted-foreground">
              New: {stats.ticketStats.new}, Open: {stats.ticketStats.open}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Tickets</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ticketStats.resolved}</div>
            <p className="text-xs text-muted-foreground">Total resolved tickets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">Based on SLA targets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customerStats.active}</div>
            <p className="text-xs text-muted-foreground">+{stats.customerStats.new_this_month} this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Ticket Activity</CardTitle>
            <CardDescription>Open vs Resolved tickets this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ticketData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="open" fill="hsl(var(--chart-1))" name="Open" />
                <Bar dataKey="resolved" fill="hsl(var(--chart-2))" name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Status Distribution</CardTitle>
            <CardDescription>Current status of all tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {statusData.map((entry, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}: {entry.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest ticket updates and customer interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{activity.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      Customer: {activity.customer_name || "Unassigned"}
                      {activity.assigned_user_name && ` • Assigned to: ${activity.assigned_user_name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        activity.priority === "urgent" || activity.priority === "high"
                          ? "destructive"
                          : activity.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {activity.priority}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
