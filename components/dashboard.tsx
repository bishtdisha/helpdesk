import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Plus, AlertCircle, CheckCircle, Clock, Users } from "lucide-react"

const ticketData = [
  { name: "Mon", open: 12, resolved: 8 },
  { name: "Tue", open: 15, resolved: 12 },
  { name: "Wed", open: 8, resolved: 14 },
  { name: "Thu", open: 18, resolved: 10 },
  { name: "Fri", open: 22, resolved: 16 },
  { name: "Sat", open: 5, resolved: 8 },
  { name: "Sun", open: 3, resolved: 6 },
]

const statusData = [
  { name: "Open", value: 45, color: "hsl(var(--chart-1))" },
  { name: "In Progress", value: 32, color: "hsl(var(--chart-2))" },
  { name: "Resolved", value: 78, color: "hsl(var(--chart-3))" },
  { name: "Closed", value: 156, color: "hsl(var(--chart-4))" },
]

export function Dashboard() {
  return (
    <div className="space-y-6">
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
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">+12% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">16</div>
            <p className="text-xs text-muted-foreground">+8% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">-15% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
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
            {[
              { action: "New ticket created", customer: "John Doe", time: "2 minutes ago", priority: "High" },
              { action: "Ticket resolved", customer: "Jane Smith", time: "15 minutes ago", priority: "Medium" },
              { action: "Customer reply", customer: "Bob Johnson", time: "1 hour ago", priority: "Low" },
              { action: "Ticket assigned", customer: "Alice Brown", time: "2 hours ago", priority: "High" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">Customer: {activity.customer}</p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      activity.priority === "High"
                        ? "destructive"
                        : activity.priority === "Medium"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {activity.priority}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
