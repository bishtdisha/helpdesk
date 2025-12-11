'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, TrendingDown, AlertTriangle, Target } from "lucide-react";
import { CleanKPICard } from "../clean-kpi-card";
import { Progress } from "@/components/ui/progress";
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

  const { percentage, status, trend, metCount, breachCount, totalCount } = data;
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

  const popoverContent = (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm mb-3">SLA Breakdown</h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">SLA Met</span>
          <span className="font-semibold text-green-600">{metCount || 0}</span>
        </div>
        <Progress value={rate} className="h-2" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-600">Met SLA</span>
          </div>
          <div className="text-xl font-bold text-green-700">{metCount || 0}</div>
        </div>
        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-medium text-red-600">Breached</span>
          </div>
          <div className="text-xl font-bold text-red-700">{breachCount || 0}</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground pt-2 border-t">
        Total tickets evaluated: {totalCount || 0}
      </div>
    </div>
  );

  return (
    <CleanKPICard
      title="SLA Compliance"
      value={`${rate.toFixed(1)}%`}
      icon={<CheckCircle className={`h-4 w-4 ${statusInfo.color}`} />}
      iconBgColor={statusInfo.bgColor}
      valueColor={statusInfo.color}
      badge={{
        text: statusInfo.label,
        variant: statusInfo.badgeVariant
      }}
      trend={trendValue !== 0 ? {
        value: `${Math.abs(trendValue).toFixed(1)}% from last period`,
        isPositive,
        icon: isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
      } : undefined}
      popoverContent={popoverContent}
      hoverTrigger={true}
      className={statusInfo.borderColor}
    />
  );
}
