'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp, TrendingDown, Info } from "lucide-react";
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

  const { resolutionTime, responseTime, trend } = data;
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

  return (
    <Card className="hover:shadow-lg transition-all h-full border-orange-200 bg-gradient-to-br from-orange-50/50 to-background">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Resolution Time</CardTitle>
        <div className="p-2 rounded-lg bg-orange-100">
          <Clock className="h-4 w-4 text-orange-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-orange-600">
          {formatTime(resolutionTime || 0)}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-muted-foreground">
            Response: <span className="font-medium text-orange-500">{formatTime(responseTime || 0)}</span>
          </p>
        </div>
        {trendValue !== 0 && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            <span>{Math.abs(trendValue).toFixed(1)}% {isPositive ? 'faster' : 'slower'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
