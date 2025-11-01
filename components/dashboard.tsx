import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { AlertCircle, CheckCircle, Clock, Users, User, Settings, Ticket, BookOpen } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { UserRoleBadge } from "@/components/rbac/user-role-badge"

const ticketData = [
  { name: "Mon", open: 12, resolved: 10 },
  { name: "Tue", open: 6, resolved: 8 },
  { name: "Wed", open: 15, resolved: 12 },
  { name: "Thu", open: 12, resolved: 14 },
  { name: "Fri", open: 8, resolved: 18 },
  { name: "Sat", open: 18, resolved: 15 },
  { name: "Sun", open: 22, resolved: 16 },
]

const statusData = [
  { name: "Open", value: 45, color: "#ef4444" },
  { name: "In Progress", value: 32, color: "#f59e0b" },
  { name: "Waiting", value: 28, color: "#6b7280" },
  { name: "Resolved", value: 78, color: "#10b981" },
  { name: "Closed", value: 128, color: "#3b82f6" },
]

export function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* Welcome Message for Admin */}
      {user && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <User className="h-5 w-5" />
              Welcome back, {user.name || 'Admin'}!
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              You're logged in as {user.email}. Here's your comprehensive dashboard overview.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Account Information</h4>
                <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <p><strong>Name:</strong> {user.name || 'Not set'}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <div className="flex items-center gap-2">
                    <strong>Role:</strong> 
                    <UserRoleBadge roleName={user.role?.name} />
                  </div>
                  <p><strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}</p>
                  <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">System Overview</h4>
                <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <p><strong>Total Tickets:</strong> 311</p>
                  <p><strong>Active Users:</strong> 1,234</p>
                  <p><strong>Teams:</strong> 8</p>
                  <p><strong>Response Rate:</strong> 98.5%</p>
                  <p><strong>System Status:</strong> <span className="text-green-600 font-medium">Operational</span></p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Quick Actions</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-white/50 hover:bg-white/80 border-blue-300"
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    View All Tickets
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-white/50 hover:bg-white/80 border-blue-300"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-white/50 hover:bg-white/80 border-blue-300"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards - Matching the image layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">45</div>
            <p className="text-xs text-red-500 flex items-center gap-1">
              <span>-12% from last week</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">16</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span>+8% from yesterday</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">2.4h</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span>-15% from last week</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">1,234</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span>+5% from last month</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Matching the image layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-gray-700">Weekly Ticket Activity</CardTitle>
            <CardDescription className="text-gray-500">Open vs Resolved tickets this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ticketData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="open" fill="#374151" name="Open" radius={[2, 2, 0, 0]} />
                <Bar dataKey="resolved" fill="#6b7280" name="Resolved" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-gray-700">Ticket Status Distribution</CardTitle>
            <CardDescription className="text-gray-500">Current status of all tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={130}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {statusData.map((entry, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}: {entry.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Admin Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-gray-700">Recent Activity</CardTitle>
            <CardDescription className="text-gray-500">Latest ticket updates and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "New ticket created", customer: "John Doe", time: "2 minutes ago", priority: "High", type: "ticket" },
                { action: "User role updated", customer: "Jane Smith", time: "15 minutes ago", priority: "Medium", type: "admin" },
                { action: "Team assignment changed", customer: "Bob Johnson", time: "1 hour ago", priority: "Low", type: "admin" },
                { action: "Ticket resolved", customer: "Alice Brown", time: "2 hours ago", priority: "High", type: "ticket" },
                { action: "New user registered", customer: "Mike Wilson", time: "3 hours ago", priority: "Medium", type: "system" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'ticket' ? 'bg-blue-500' : 
                      activity.type === 'admin' ? 'bg-purple-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">
                        {activity.type === 'admin' ? 'Admin Action' : 'User'}: {activity.customer}
                      </p>
                    </div>
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
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-gray-700">System Health</CardTitle>
            <CardDescription className="text-gray-500">Current system status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Response</span>
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                  Fast
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cache</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  Warming
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage</span>
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                  85% Free
                </Badge>
              </div>
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Quick Stats</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="font-medium">99.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Sessions:</span>
                    <span className="font-medium">247</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Requests:</span>
                    <span className="font-medium">12.4K</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
