import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, CheckCircle, Clock, Users, User } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

// Mock data - in real implementation, this would come from API
const ticketData = [
  { name: "Mon", open: 12, resolved: 10 },
  { name: "Tue", open: 6, resolved: 8 },
  { name: "Wed", open: 15, resolved: 12 },
  { name: "Thu", open: 12, resolved: 14 },
  { name: "Fri", open: 8, resolved: 18 },
  { name: "Sat", open: 18, resolved: 15 },
  { name: "Sun", open: 22, resolved: 16 },
];

const statusData = [
  { name: "Open", value: 45, color: "#ef4444" },
  { name: "In Progress", value: 32, color: "#f59e0b" },
  { name: "Waiting", value: 28, color: "#6b7280" },
  { name: "Resolved", value: 78, color: "#10b981" },
  { name: "Closed", value: 128, color: "#3b82f6" },
];

interface DashboardWidgetProps {
  id: string;
  title: string;
  component: string;
}

export function DashboardWidget({ id, title, component }: DashboardWidgetProps) {
  const { user } = useAuth();

  const renderWidget = () => {
    switch (component) {
      case 'WelcomeWidget':
        return (
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/20 to-transparent dark:via-slate-700/20"></div>
            <CardHeader className="relative py-3 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  <div className="p-1.5 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 shadow-sm">
                    <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  Welcome back, {user?.name || 'User'}!
                </CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Ready to tackle today's challenges? Here's your dashboard overview.
              </CardDescription>
            </CardHeader>
          </Card>
        );

      case 'MetricWidget':
        const getMetricData = () => {
          switch (id) {
            case 'open-tickets':
              return { value: 45, change: '-12%', changeType: 'negative', icon: AlertCircle, color: 'text-orange-500' };
            case 'resolved-today':
              return { value: 16, change: '+8%', changeType: 'positive', icon: CheckCircle, color: 'text-green-500' };
            case 'avg-response-time':
              return { value: '2.4h', change: '-15%', changeType: 'positive', icon: Clock, color: 'text-blue-500' };
            case 'active-customers':
              return { value: '1,234', change: '+5%', changeType: 'positive', icon: Users, color: 'text-purple-500' };
            default:
              return { value: 0, change: '0%', changeType: 'neutral', icon: AlertCircle, color: 'text-gray-500' };
          }
        };

        const metric = getMetricData();
        const Icon = metric.icon;

        return (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{metric.value}</div>
              <p className={`text-xs flex items-center gap-1 ${
                metric.changeType === 'positive' ? 'text-green-500' : 
                metric.changeType === 'negative' ? 'text-red-500' : 'text-gray-500'
              }`}>
                <span>{metric.change} from last period</span>
              </p>
            </CardContent>
          </Card>
        );

      case 'WeeklyActivityChart':
        return (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-700">Weekly Ticket Activity</CardTitle>
                  <CardDescription className="text-gray-500">Open vs Resolved tickets this week</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
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
        );

      case 'StatusDistributionChart':
        return (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-700">Ticket Status Distribution</CardTitle>
                  <CardDescription className="text-gray-500">Current status of all tickets</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
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
        );

      case 'RecentActivityWidget':
        return (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-700">Recent Activity</CardTitle>
                  <CardDescription className="text-gray-500">Latest ticket updates and system events</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "New ticket created", customer: "John Doe", time: "2 minutes ago", priority: "High", type: "ticket" },
                  { action: "User role updated", customer: "Jane Smith", time: "15 minutes ago", priority: "Medium", type: "admin" },
                  { action: "Team assignment changed", customer: "Bob Johnson", time: "1 hour ago", priority: "Low", type: "admin" },
                  { action: "Ticket resolved", customer: "Alice Brown", time: "2 hours ago", priority: "High", type: "ticket" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${activity.type === 'ticket' ? 'bg-blue-500' :
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
        );

      default:
        return (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Widget not implemented: {component}</p>
            </CardContent>
          </Card>
        );
    }
  }
  return renderWidget();
}