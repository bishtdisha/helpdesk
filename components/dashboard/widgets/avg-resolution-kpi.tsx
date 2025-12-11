'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp, TrendingDown, Timer, Zap } from "lucide-react";
import { CleanKPICard } from "../clean-kpi-card";
import { Badge } from "@/components/ui/badge";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function AvgResolutionKPI() {
  const { data, isLoading, error } = useSWR('/api/dashboard/kpis/avg-resolution', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full border-red-200 bg-red-50/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Avg Resolution Time</CardTitle>
          <Clock className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">Error</div>
          <p className="text-xs text-red-500 mt-1">Failed to load</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Avg Resolution Time</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
        </CardContent>
      </Card>
    );
  }

  const { resolutionTime, responseTime, trend, firstResponseTime, avgHandlingTime } = data;
  const trendValue = trend || 0;
  // For resolution time, lower is better, so invert the trend
  const isPositive = trendValue < 0;

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}d ${remainingHours}h`;
    }
  };

  const popoverContent = (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm mb-3">Time Breakdown</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-blue-600">First Response</span>
          </div>
          <div className="text-xl font-bold text-blue-700">
            {formatTime(firstResponseTime || responseTime || 0)}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs font-medium text-purple-600">Handling Time</span>
          </div>
          <div className="text-xl font-bold text-purple-700">
            {formatTime(avgHandlingTime || resolutionTime || 0)}
          </div>
        </div>
      </div>
      <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-orange-600">Performance Status</span>
          <Badge variant={resolutionTime < 24 ? "default" : resolutionTime < 48 ? "secondary" : "destructive"} className="text-xs">
            {resolutionTime < 24 ? "Excellent" : resolutionTime < 48 ? "Good" : "Needs Improvement"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Average time from ticket creation to resolution
        </p>
      </div>
    </div>
  );

  return (
    <CleanKPICard
      title="Avg Resolution Time"
      value={formatTime(resolutionTime || 0)}
      icon={<Clock className="h-4 w-4 text-orange-600" />}
      iconBgColor="bg-orange-100 dark:bg-orange-900/30"
      valueColor="text-orange-600"
      badge={{
        text: `Response: ${formatTime(responseTime || 0)}`,
        variant: 'outline'
      }}
      trend={trendValue !== 0 ? {
        value: `${Math.abs(trendValue).toFixed(1)}% ${isPositive ? 'faster' : 'slower'}`,
        isPositive,
        icon: isPositive ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />
      } : undefined}
      popoverContent={popoverContent}
      hoverTrigger={true}
      className="border-orange-200 dark:border-orange-800"
    />
  );
}
