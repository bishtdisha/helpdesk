'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag, TrendingUp, TrendingDown } from "lucide-react";
import { CleanKPICard } from "../clean-kpi-card";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function PriorityMixKPI() {
  const { data, isLoading, error } = useSWR('/api/dashboard/kpis/priority-mix', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full border-red-200 bg-red-50/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Priority Mix</CardTitle>
          <Flag className="h-4 w-4 text-red-500" />
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
          <CardTitle className="text-sm font-medium text-muted-foreground">Priority Mix</CardTitle>
          <Flag className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
        </CardContent>
      </Card>
    );
  }

  const { urgent, high, medium, low, total, highPriorityPercent, trend } = data;
  const criticalCount = (urgent || 0) + (high || 0);
  const trendValue = trend || 0;
  const isPositive = trendValue < 0; // Lower high priority % is better

  // Determine status based on high priority percentage
  const getStatusInfo = () => {
    const highPercent = highPriorityPercent || 0;
    if (highPercent <= 20) {
      return {
        label: 'Healthy',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        borderColor: 'border-green-200 dark:border-green-800',
        badgeVariant: 'default' as const,
      };
    } else if (highPercent <= 40) {
      return {
        label: 'Moderate',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        badgeVariant: 'secondary' as const,
      };
    } else {
      return {
        label: 'High Load',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        borderColor: 'border-red-200 dark:border-red-800',
        badgeVariant: 'destructive' as const,
      };
    }
  };

  const statusInfo = getStatusInfo();

  const popoverContent = (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm mb-3">Priority Breakdown</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-600" />
            <span className="text-xs font-medium text-red-600">Urgent</span>
          </div>
          <div className="text-xl font-bold text-red-700">{urgent || 0}</div>
        </div>
        <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-xs font-medium text-orange-600">High</span>
          </div>
          <div className="text-xl font-bold text-orange-700">{high || 0}</div>
        </div>
        <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-xs font-medium text-yellow-600">Medium</span>
          </div>
          <div className="text-xl font-bold text-yellow-700">{medium || 0}</div>
        </div>
        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-600">Low</span>
          </div>
          <div className="text-xl font-bold text-green-700">{low || 0}</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground pt-2 border-t">
        Total open tickets: {total || 0}
      </div>
    </div>
  );

  return (
    <CleanKPICard
      title="Priority Mix"
      value={`${criticalCount} Critical`}
      icon={<Flag className={`h-4 w-4 ${statusInfo.color}`} />}
      iconBgColor={statusInfo.bgColor}
      valueColor={statusInfo.color}
      badge={{
        text: statusInfo.label,
        variant: statusInfo.badgeVariant
      }}
      trend={trendValue !== 0 ? {
        value: `${Math.abs(trendValue).toFixed(1)}% high priority`,
        isPositive,
        icon: isPositive ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />
      } : undefined}
      popoverContent={popoverContent}
      hoverTrigger={true}
      className={statusInfo.borderColor}
    />
  );
}
