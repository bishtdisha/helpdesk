'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, TrendingDown, Info } from "lucide-react";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function SLAComplianceKPI() {
  const { data, isLoading, error } = useSWR('/api/dashboard/kpis/sla-compliance', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full border-red-200 bg-red-50/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">SLA Compliance</CardTitle>
          <CheckCircle className="h-4 w-4 text-red-500" />
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
          <CardTitle className="text-sm font-medium text-muted-foreground">SLA Compliance</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded mt-2" />
        </CardContent>
      </Card>
    );
  }

  const { percentage, status, trend } = data;
  const rate = percentage || 0;
  const trendValue = trend || 0;
  const isPositive = trendValue > 0;

  // Determine status and colors
  const getStatusInfo = () => {
    if (rate >= 90) {
      return {
        label: 'Excellent',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        gradientFrom: 'from-green-50/50',
        badgeVariant: 'default' as const,
      };
    } else if (rate >= 80) {
      return {
        label: 'Good',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200',
        gradientFrom: 'from-yellow-50/50',
        badgeVariant: 'secondary' as const,
      };
    } else {
      return {
        label: 'Needs Attention',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        gradientFrom: 'from-red-50/50',
        badgeVariant: 'destructive' as const,
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className={`hover:shadow-lg transition-all h-full ${statusInfo.borderColor} bg-gradient-to-br ${statusInfo.gradientFrom} to-background`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">SLA Compliance</CardTitle>
        <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
          <CheckCircle className={`h-4 w-4 ${statusInfo.color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${statusInfo.color}`}>{rate.toFixed(1)}%</div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={statusInfo.badgeVariant} className="text-xs">
            {statusInfo.label}
          </Badge>
        </div>
        {trendValue !== 0 && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(trendValue).toFixed(1)}% from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
