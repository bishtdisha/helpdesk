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
  user?: {
    id: string;
    name: string | null;
    role?: {
      name: string;
    } | null;
  } | null;
}

export function DashboardWidget({ id, title, component, user }: DashboardWidgetProps) {
  // User passed as prop - no need to call useAuth() here
  const isLoading = !user || user.id === 'loading';

  const renderWidget = () => {
    // Show skeleton while loading
    if (isLoading) {
      return (
        <Card className="hover:shadow-md transition-shadow h-full border border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-muted animate-pulse rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardHeader>
        </Card>
      );
    }
    switch (component) {
      case 'WelcomeWidget':
        return (
          <Card className="relative overflow-hidden border border-border shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-primary/5 via-background to-primary/5 dark:from-primary/10 dark:via-background dark:to-primary/10 h-full !py-4 !gap-2">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent dark:via-primary/10"></div>
            <CardHeader className="relative !py-0 !pb-0 !px-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold leading-tight mb-1">
                    Welcome back, {user?.name || 'User'}!
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Ready to tackle today's challenges? Here's your dashboard overview.
                  </CardDescription>
                </div>
              </div>
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
          <Card className="hover:shadow-md transition-shadow h-full !py-2 !gap-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 !pb-0 !pt-0 !px-3 !gap-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className={`h-3.5 w-3.5 ${metric.color}`} />
            </CardHeader>
            <CardContent className="!px-3 !pb-0">
              <div className="text-2xl font-bold leading-none">{metric.value}</div>
              <p className={`text-xs flex items-center gap-1 mt-1 ${
                metric.changeType === 'positive' ? 'text-green-500' : 
                metric.changeType === 'negative' ? 'text-red-500' : 'text-gray-500'
              }`}>
                <span>{metric.change}</span>
              </p>
            </CardContent>
          </Card>
        );

      case 'WeeklyActivityChart':
        return (
          <Card className="hover:shadow-md transition-shadow h-full flex flex-col !py-4 !gap-3 min-h-[380px]">
            <CardHeader className="!pb-2 !pt-2 !px-5">
              <CardTitle className="text-base font-semibold">Weekly Ticket Activity</CardTitle>
              <CardDescription className="text-sm">Open vs Resolved</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 !px-4 !pb-4 min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketData} margin={{ top: 20, right: 20, left: 0, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      fontSize: '13px',
                      padding: '8px 12px'
                    }}
                  />
                  <Bar dataKey="open" fill="#3b82f6" name="Open" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      case 'StatusDistributionChart':
        return (
          <Card className="hover:shadow-md transition-shadow h-full flex flex-col !py-4 !gap-3 min-h-[380px]">
            <CardHeader className="!pb-2 !pt-2 !px-5">
              <CardTitle className="text-base font-semibold">Status Distribution</CardTitle>
              <CardDescription className="text-sm">Current breakdown</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 !px-4 !pb-4 flex flex-col min-h-[280px]">
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={{
                        stroke: '#94a3b8',
                        strokeWidth: 1.5
                      }}
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
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        fontSize: '13px',
                        padding: '8px 12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {statusData.map((entry, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1.5 text-xs px-3 py-1.5 font-medium">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}: {entry.value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'RecentActivityWidget':
        return (
          <Card className="hover:shadow-md transition-shadow h-full flex flex-col !py-2 !gap-1">
            <CardHeader className="!pb-0 !pt-0 !px-3">
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Latest updates</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 !px-3 !pb-1 overflow-auto">
              <div className="space-y-1.5">
                {[
                  { action: "New ticket created", customer: "John Doe", time: "2m", priority: "High", type: "ticket" },
                  { action: "User role updated", customer: "Jane Smith", time: "15m", priority: "Med", type: "admin" },
                  { action: "Team assignment", customer: "Bob Johnson", time: "1h", priority: "Low", type: "admin" },
                  { action: "Ticket resolved", customer: "Alice Brown", time: "2h", priority: "High", type: "ticket" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-1.5 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activity.type === 'ticket' ? 'bg-blue-500' :
                        activity.type === 'admin' ? 'bg-purple-500' : 'bg-green-500'
                        }`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate leading-tight">{activity.action}</p>
                        <p className="text-[10px] text-muted-foreground truncate leading-tight">
                          {activity.customer}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-1.5">
                      <Badge
                        variant={
                          activity.priority === "High"
                            ? "destructive"
                            : activity.priority === "Med"
                              ? "default"
                              : "secondary"
                        }
                        className="text-[9px] px-1 py-0 h-4"
                      >
                        {activity.priority}
                      </Badge>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{activity.time}</p>
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