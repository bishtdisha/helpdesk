'use client';

import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, Users, User } from "lucide-react";
import useSWR from 'swr';

// Lazy load chart components
const WeeklyActivityChart = lazy(() => import('./charts/weekly-activity-chart').then(mod => ({ default: mod.WeeklyActivityChart })));
const StatusDistributionChart = lazy(() => import('./charts/status-distribution-chart').then(mod => ({ default: mod.StatusDistributionChart })));

// Import new KPI widgets
import { TotalTicketsKPI } from './widgets/total-tickets-kpi';
import { SLAComplianceKPI } from './widgets/sla-compliance-kpi';
import { AvgResolutionKPI } from './widgets/avg-resolution-kpi';
import { CSATScoreKPI } from './widgets/csat-score-kpi';
import { MyTicketsSummary } from './widgets/my-tickets-summary';
import { SLABreachAlerts } from './widgets/sla-breach-alerts';
import { TodayPerformance } from './widgets/today-performance';
import { WeekPerformance } from './widgets/week-performance';
import { DailyTarget } from './widgets/daily-target';
import { TicketTrendChart } from './widgets/ticket-trend-chart';
import { ResolutionTrendChart } from './widgets/resolution-trend-chart';
import { SLATrendChart } from './widgets/sla-trend-chart';
import { WorkloadByStatus } from './widgets/workload-by-status';
import { AssignedTicketsList } from './widgets/assigned-tickets-list';
import { TopCategories } from './widgets/top-categories';
import { FollowingTicketsWidget } from './widgets/following-tickets-widget';

const fetcher = (url: string) => fetch(url).then(res => res.json());

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
  // Temporarily disabled to fix infinite loop
  const stats = null;
  const statsLoading = false;
  const statsError = null;
  
  // const { data: stats, isLoading: statsLoading, error: statsError } = useSWR(
  //   component === 'MetricWidget' ? '/api/dashboard/stats' : null,
  //   fetcher,
  //   { 
  //     refreshInterval: 0,
  //     revalidateOnFocus: false,
  //     dedupingInterval: 30000,
  //     errorRetryCount: 0,
  //     shouldRetryOnError: false,
  //   }
  // );

  // Temporarily disabled to prevent infinite loop
  const activityData = null;
  const activityLoading = false;
  const statusData = null;
  const statusLoading = false;
  const recentActivity = null;
  const recentLoading = false;

  // const { data: activityData, isLoading: activityLoading } = useSWR(
  //   component === 'WeeklyActivityChart' ? '/api/dashboard/activity' : null,
  //   fetcher,
  //   { 
  //     refreshInterval: 0,
  //     revalidateOnFocus: false,
  //     dedupingInterval: 30000,
  //     errorRetryCount: 0,
  //     shouldRetryOnError: false,
  //   }
  // );

  // const { data: statusData, isLoading: statusLoading } = useSWR(
  //   component === 'StatusDistributionChart' ? '/api/dashboard/status-distribution' : null,
  //   fetcher,
  //   { 
  //     refreshInterval: 0,
  //     revalidateOnFocus: false,
  //     dedupingInterval: 30000,
  //     errorRetryCount: 0,
  //     shouldRetryOnError: false,
  //   }
  // );

  // const { data: recentActivity, isLoading: recentLoading } = useSWR(
  //   component === 'RecentActivityWidget' ? '/api/dashboard/recent-activity' : null,
  //   fetcher,
  //   { 
  //     refreshInterval: 0,
  //     revalidateOnFocus: false,
  //     dedupingInterval: 15000,
  //     errorRetryCount: 0,
  //     shouldRetryOnError: false,
  //   }
  // );

  const isLoading = !user || user.id === 'loading';

  const renderWidget = () => {
    // Show skeleton while loading user
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
          if (statsError) {
            return { value: 'Error', change: '0%', changeType: 'neutral' as const, icon: AlertCircle, color: 'text-red-500' };
          }
          if (statsLoading || !stats) {
            return { value: '...', change: '...', changeType: 'neutral' as const, icon: AlertCircle, color: 'text-gray-500' };
          }

          // Type guard to ensure stats is defined
          const safeStats = stats;

          switch (id) {
            case 'open-tickets':
              return { 
                value: safeStats.openTickets?.value ?? 0, 
                change: `${safeStats.openTickets?.change ?? 0}%`, 
                changeType: (safeStats.openTickets?.changeType ?? 'neutral') as 'positive' | 'negative' | 'neutral', 
                icon: AlertCircle, 
                color: 'text-orange-500' 
              };
            case 'resolved-today':
              return { 
                value: safeStats.resolvedToday?.value ?? 0, 
                change: `+${safeStats.resolvedToday?.change ?? 0}%`, 
                changeType: (safeStats.resolvedToday?.changeType ?? 'positive') as 'positive' | 'negative' | 'neutral', 
                icon: CheckCircle, 
                color: 'text-green-500' 
              };
            case 'avg-response-time':
              return { 
                value: safeStats.avgResponseTime?.value ?? '0h', 
                change: `${safeStats.avgResponseTime?.change ?? 0}%`, 
                changeType: (safeStats.avgResponseTime?.changeType ?? 'positive') as 'positive' | 'negative' | 'neutral', 
                icon: Clock, 
                color: 'text-blue-500' 
              };
            case 'active-customers':
              return { 
                value: (safeStats.activeCustomers?.value ?? 0).toLocaleString(), 
                change: `+${safeStats.activeCustomers?.change ?? 0}%`, 
                changeType: (safeStats.activeCustomers?.changeType ?? 'positive') as 'positive' | 'negative' | 'neutral', 
                icon: Users, 
                color: 'text-purple-500' 
              };
            default:
              return { value: 0, change: '0%', changeType: 'neutral' as const, icon: AlertCircle, color: 'text-gray-500' };
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
              <div className="text-2xl font-bold leading-none">
                {statsLoading ? <div className="h-8 w-16 bg-muted animate-pulse rounded" /> : metric.value}
              </div>
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
        if (activityLoading || !activityData) {
          return (
            <Card className="hover:shadow-md transition-shadow h-full flex flex-col !py-4 !gap-3 min-h-[380px]">
              <CardHeader className="!pb-2 !pt-2 !px-5">
                <CardTitle className="text-base font-semibold">Weekly Ticket Activity</CardTitle>
                <CardDescription className="text-sm">Open vs Resolved</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 !px-4 !pb-4 min-h-[280px] flex items-center justify-center">
                <div className="w-full h-40 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          );
        }
        return (
          <Suspense fallback={
            <Card className="hover:shadow-md transition-shadow h-full flex flex-col !py-4 !gap-3 min-h-[380px]">
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="w-full h-40 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          }>
            <WeeklyActivityChart data={activityData} />
          </Suspense>
        );

      case 'StatusDistributionChart':
        if (statusLoading || !statusData) {
          return (
            <Card className="hover:shadow-md transition-shadow h-full flex flex-col !py-4 !gap-3 min-h-[380px]">
              <CardHeader className="!pb-2 !pt-2 !px-5">
                <CardTitle className="text-base font-semibold">Status Distribution</CardTitle>
                <CardDescription className="text-sm">Current breakdown</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 !px-4 !pb-4 flex items-center justify-center min-h-[280px]">
                <div className="w-48 h-48 rounded-full bg-muted animate-pulse" />
              </CardContent>
            </Card>
          );
        }
        return (
          <Suspense fallback={
            <Card className="hover:shadow-md transition-shadow h-full flex flex-col !py-4 !gap-3 min-h-[380px]">
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-muted animate-pulse" />
              </CardContent>
            </Card>
          }>
            <StatusDistributionChart data={statusData} />
          </Suspense>
        );

      case 'RecentActivityWidget':
        const activities = recentActivity || [];
        return (
          <Card className="hover:shadow-md transition-shadow h-full flex flex-col !py-2 !gap-1">
            <CardHeader className="!pb-0 !pt-0 !px-3">
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Latest updates</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 !px-3 !pb-1 overflow-auto">
              {recentLoading ? (
                <div className="space-y-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activities.map((activity: any, index: number) => (
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
              )}
            </CardContent>
          </Card>
        );

      // New KPI Widgets
      case 'TotalTicketsKPI':
        return <TotalTicketsKPI />;
      
      case 'SLAComplianceKPI':
        return <SLAComplianceKPI />;
      
      case 'AvgResolutionKPI':
        return <AvgResolutionKPI />;
      
      case 'CSATScoreKPI':
        return <CSATScoreKPI />;

      // New Summary Widgets
      case 'MyTicketsSummary':
        return <MyTicketsSummary />;
      
      case 'SLABreachAlerts':
        return <SLABreachAlerts />;

      // Performance Widgets
      case 'TodayPerformance':
        return <TodayPerformance />;
      
      case 'WeekPerformance':
        return <WeekPerformance />;
      
      case 'DailyTarget':
        return <DailyTarget />;

      // Trend Charts
      case 'TicketTrendChart':
        return <TicketTrendChart />;
      
      case 'ResolutionTrendChart':
        return <ResolutionTrendChart />;
      
      case 'SLATrendChart':
        return <SLATrendChart />;

      // Extras
      case 'WorkloadByStatus':
        return <WorkloadByStatus />;
      
      case 'AssignedTicketsList':
        return <AssignedTicketsList />;
      
      case 'TopCategories':
        return <TopCategories />;
      
      case 'FollowingTicketsWidget':
        return <FollowingTicketsWidget />;

      default:
        return (
          <Card className="hover:shadow-md transition-shadow h-full">
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