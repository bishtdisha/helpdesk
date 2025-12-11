'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle } from "lucide-react";
import { CleanKPICard } from "../clean-kpi-card";
import { Badge } from "@/components/ui/badge";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function TotalTicketsKPI() {
  const { data, isLoading, error } = useSWR('/api/dashboard/kpis/total-tickets', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full border-red-200 bg-red-50/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
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
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
          <AlertCircle className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
        </CardContent>
      </Card>
    );
  }

  const { total, open, resolved, trend, pending, inProgress, closed } = data;
  const trendValue = trend || 0;
  const isPositive = trendValue > 0;

  const popoverContent = (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm mb-3">Status Breakdown</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-xs font-medium text-orange-600">Open</span>
          </div>
          <div className="text-xl font-bold text-orange-700">{open || 0}</div>
        </div>
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-blue-600">In Progress</span>
          </div>
          <div className="text-xl font-bold text-blue-700">{inProgress || 0}</div>
        </div>
        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-600">Resolved</span>
          </div>
          <div className="text-xl font-bold text-green-700">{resolved || 0}</div>
        </div>
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-xs font-medium text-gray-600">Closed</span>
          </div>
          <div className="text-xl font-bold text-gray-700">{closed || 0}</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground pt-2 border-t">
        Total tickets evaluated: {total || 0}
      </div>
    </div>
  );

  return (
    <CleanKPICard
      title="Total Tickets"
      value={total || 0}
      icon={<AlertCircle className="h-4 w-4 text-blue-600" />}
      iconBgColor="bg-blue-100 dark:bg-blue-900/30"
      valueColor="text-blue-600"
      badge={{
        text: `${open || 0} open`,
        variant: 'outline'
      }}
      trend={trendValue !== 0 ? {
        value: `${Math.abs(trendValue)}% from last period`,
        isPositive,
        icon: isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
      } : undefined}
      popoverContent={popoverContent}
      hoverTrigger={true}
      className="border-blue-200 dark:border-blue-800"
    />
  );
}
