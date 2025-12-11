'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, TrendingDown, ThumbsUp, ThumbsDown, Meh } from "lucide-react";
import { CleanKPICard } from "../clean-kpi-card";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function CSATScoreKPI() {
  const { data, isLoading, error } = useSWR('/api/dashboard/kpis/csat', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full border-red-200 bg-red-50/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Customer Satisfaction</CardTitle>
          <Star className="h-4 w-4 text-red-500" />
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
          <CardTitle className="text-sm font-medium text-muted-foreground">Customer Satisfaction</CardTitle>
          <Star className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded mt-2" />
        </CardContent>
      </Card>
    );
  }

  const { score, totalResponses, trend, positiveCount, neutralCount, negativeCount } = data;
  const rating = score || 0;
  const trendValue = trend || 0;
  const isPositive = trendValue > 0;

  // Determine status
  const getStatusInfo = () => {
    if (rating >= 4.5) {
      return {
        label: 'Excellent',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-200',
        gradientFrom: 'from-purple-50/50',
        badgeVariant: 'default' as const,
      };
    } else if (rating >= 4.0) {
      return {
        label: 'Good',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        gradientFrom: 'from-blue-50/50',
        badgeVariant: 'secondary' as const,
      };
    } else if (rating >= 3.5) {
      return {
        label: 'Fair',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200',
        gradientFrom: 'from-yellow-50/50',
        badgeVariant: 'secondary' as const,
      };
    } else {
      return {
        label: 'Poor',
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
      <h4 className="font-semibold text-sm mb-3">Sentiment Breakdown</h4>
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-center">
          <ThumbsUp className="h-4 w-4 text-green-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-700">{positiveCount || 0}</div>
          <span className="text-xs text-green-600">Positive</span>
        </div>
        <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 text-center">
          <Meh className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-yellow-700">{neutralCount || 0}</div>
          <span className="text-xs text-yellow-600">Neutral</span>
        </div>
        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-center">
          <ThumbsDown className="h-4 w-4 text-red-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-red-700">{negativeCount || 0}</div>
          <span className="text-xs text-red-600">Negative</span>
        </div>
      </div>
      <div className="p-2 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">Satisfaction Rate</span>
          <span className="text-xs font-bold">{totalResponses > 0 ? ((positiveCount || 0) / totalResponses * 100).toFixed(1) : 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${totalResponses > 0 ? ((positiveCount || 0) / totalResponses * 100) : 0}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <CleanKPICard
      title="Customer Satisfaction"
      value={`${rating.toFixed(1)}/5`}
      icon={<Star className={`h-4 w-4 ${statusInfo.color}`} />}
      iconBgColor={statusInfo.bgColor}
      valueColor={statusInfo.color}
      badge={{
        text: statusInfo.label,
        variant: statusInfo.badgeVariant
      }}
      trend={trendValue !== 0 ? {
        value: `${Math.abs(trendValue).toFixed(2)} from last period`,
        isPositive,
        icon: isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
      } : undefined}
      popoverContent={popoverContent}
      hoverTrigger={true}
      className={statusInfo.borderColor}
    />
  );
}
