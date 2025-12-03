'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Target, TrendingUp, TrendingDown } from "lucide-react";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function WeekPerformance() {
  const { data, isLoading, error } = useSWR('/api/dashboard/performance/week', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-12 bg-muted animate-pulse rounded" />
            <div className="h-12 bg-muted animate-pulse rounded" />
            <div className="h-12 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { resolved, avgResolutionTime, slaSuccessRate, trends } = data;

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${Math.round(hours % 24)}h`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Last 7 Days</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Total Resolved</p>
            {trends?.resolved !== 0 && (
              <div className={`flex items-center gap-1 text-xs ${trends?.resolved > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trends?.resolved > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(trends?.resolved || 0)}%</span>
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-green-600">{resolved}</p>
        </div>

        <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Avg Resolution</p>
            {trends?.resolutionTime !== 0 && (
              <div className={`flex items-center gap-1 text-xs ${trends?.resolutionTime < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trends?.resolutionTime < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                <span>{Math.abs(trends?.resolutionTime || 0)}%</span>
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-orange-600">{formatTime(avgResolutionTime)}</p>
        </div>

        <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">SLA Success</p>
            {trends?.sla !== 0 && (
              <div className={`flex items-center gap-1 text-xs ${trends?.sla > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trends?.sla > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(trends?.sla || 0).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-blue-600">{slaSuccessRate.toFixed(1)}%</p>
        </div>
      </CardContent>
    </Card>
  );
}
