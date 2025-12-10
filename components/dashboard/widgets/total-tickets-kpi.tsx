'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp, TrendingDown, Info } from "lucide-react";
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

  const { total, open, resolved, trend } = data;
  const trendValue = trend || 0;
  const isPositive = trendValue > 0;

  return (
    <Card className="hover:shadow-lg transition-all h-full border-blue-200 bg-gradient-to-br from-blue-50/50 to-background">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
        <div className="p-2 rounded-lg bg-blue-100">
          <AlertCircle className="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-blue-600">{total || 0}</div>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-muted-foreground">
            <span className="text-orange-600 font-medium">{open || 0} open</span>
            {' • '}
            <span className="text-green-600 font-medium">{resolved || 0} resolved</span>
          </p>
        </div>
        {trendValue !== 0 && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(trendValue)}% from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
