'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Ticket, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  User,
  BarChart3,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useDashboardData } from '@/lib/hooks/use-dashboard-data';
import { useAuth } from '@/lib/hooks/use-auth';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';

// Memoized KPI Card for performance
const KPICard = memo(function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <Card className={`relative overflow-hidden border-l-4 ${colorClass} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-lg bg-opacity-10 ${colorClass.replace('border-l-', 'bg-')}`}>
            <Icon className={`h-5 w-5 ${colorClass.replace('border-l-', 'text-')}`} />
          </div>
        </div>
        {trend && (
          <div className={`mt-2 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from yesterday
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Priority Badge Component
const PriorityBadge = memo(function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };
  return (
    <Badge className={`${colors[priority] || 'bg-gray-100'} text-xs`}>
      {priority}
    </Badge>
  );
});

// Status Badge Component
const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    WAITING_FOR_CUSTOMER: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  };
  const labels: Record<string, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    WAITING_FOR_CUSTOMER: 'Waiting',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };
  return (
    <Badge className={`${colors[status] || 'bg-gray-100'} text-xs`}>
      {labels[status] || status}
    </Badge>
  );
});

// Dashboard Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome skeleton */}
      <div className="h-20 bg-muted rounded-lg" />
      
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-muted rounded-lg" />
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

export function OptimizedDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, refresh } = useDashboardData();

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg font-medium">Failed to load dashboard</p>
        <Button onClick={() => refresh()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const { kpis, priorityDistribution, recentTickets, dailyTrend } = data;

  return (
    <main className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 border border-blue-100 dark:border-blue-900">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'User'}!</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here's your helpdesk overview for today
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Open"
          value={kpis.openTickets}
          subtitle="Active tickets"
          icon={Ticket}
          colorClass="border-l-blue-500"
        />
        <KPICard
          title="My Tickets"
          value={kpis.myTickets}
          subtitle="Assigned to you"
          icon={User}
          colorClass="border-l-purple-500"
        />
        <KPICard
          title="SLA Compliance"
          value={`${kpis.slaCompliance}%`}
          subtitle={`${kpis.slaAtRisk} at risk`}
          icon={Clock}
          colorClass="border-l-green-500"
        />
        <KPICard
          title="Avg Resolution"
          value={kpis.avgResolutionFormatted}
          subtitle={`${kpis.resolvedToday} resolved today`}
          icon={CheckCircle}
          colorClass="border-l-orange-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tickets List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">My Active Tickets</CardTitle>
            <Link href="/helpdesk/tickets?assignedTo=me">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active tickets assigned to you</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.slice(0, 5).map(ticket => (
                  <Link 
                    key={ticket.id} 
                    href={`/helpdesk/tickets/${ticket.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-blue-600">
                            #{String(ticket.ticketNumber).padStart(5, '0')}
                          </span>
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                        <p className="text-sm font-medium truncate mt-1">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.customer?.name || 'Unknown'} • {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <StatusBadge status={ticket.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorityDistribution.map(item => {
                const total = priorityDistribution.reduce((sum, p) => sum + p.count, 0);
                const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                const colors: Record<string, string> = {
                  URGENT: 'bg-red-500',
                  HIGH: 'bg-orange-500',
                  MEDIUM: 'bg-yellow-500',
                  LOW: 'bg-green-500',
                };
                
                return (
                  <div key={item.priority}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.priority}</span>
                      <span className="text-sm text-muted-foreground">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[item.priority] || 'bg-gray-500'} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SLA Status */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3">SLA Status</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">At Risk</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{kpis.slaAtRisk}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Breached</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 mt-1">{kpis.slaBreached}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Today's Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{kpis.createdToday}</p>
              <p className="text-sm text-muted-foreground">Created</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{kpis.resolvedToday}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{kpis.openTickets}</p>
              <p className="text-sm text-muted-foreground">Open</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{kpis.avgResolutionFormatted}</p>
              <p className="text-sm text-muted-foreground">Avg Resolution</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
