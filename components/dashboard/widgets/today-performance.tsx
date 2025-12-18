'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter, useDateRangeFilter } from "@/components/ui/date-range-filter";
import { CheckCircle, Clock, Target, TrendingUp, TrendingDown, Minus, MessageCircle } from "lucide-react";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function TodayPerformance() {
  const { value: dateFilter, setValue: setDateFilter, getApiParams } = useDateRangeFilter('today');

  // Build API URL with useMemo to create stable SWR key
  const apiUrl = useMemo(() => {
    return `/api/dashboard/performance/today?${getApiParams()}`;
  }, [getApiParams]);

  const { data, isLoading, error } = useSWR(apiUrl, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  const getTitle = () => {
    if (dateFilter.range === 'custom') {
      return `Performance: ${dateFilter.label}`;
    }
    switch (dateFilter.range) {
      case 'today': return "Today's Performance";
      case '7days': return "Last 7 Days Performance";
      case '15days': return "Last 15 Days Performance";
      case '30days': return "Last 30 Days Performance";
      default: return "Performance";
    }
  };

  const renderHeader = () => (
    <CardHeader className="space-y-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base font-semibold">{getTitle()}</CardTitle>
        <DateRangeFilter value={dateFilter} onChange={setDateFilter} showToday={true} />
      </div>
    </CardHeader>
  );

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full border-red-200 bg-red-50/50">
        {renderHeader()}
        <CardContent>
          <p className="text-sm text-red-600">Failed to load</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        {renderHeader()}
        <CardContent>
          <div className="space-y-3">
            <div className="h-12 bg-muted animate-pulse rounded" />
            <div className="h-12 bg-muted animate-pulse rounded" />
            <div className="h-12 bg-muted animate-pulse rounded" />
            <div className="h-12 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { resolved, assignedTickets, slaSuccessRate, firstResponseTime, comparison } = data;

  const renderChangeIndicator = (change: number, _isPercentage = false, invertColors = false) => {
    if (change === 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Minus className="h-3 w-3" />
          <span>No change</span>
        </span>
      );
    }
    const isPositive = change > 0;
    // For response time, negative (faster) is good, so invert the colors
    const isGood = invertColors ? !isPositive : isPositive;
    return (
      <span className={`flex items-center gap-1 text-xs ${isGood ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
      </span>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      {renderHeader()}
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{resolved}</p>
            </div>
          </div>
          {comparison && (
            <div className="text-right">
              {renderChangeIndicator(comparison.resolved.change)}
              <p className="text-[10px] text-muted-foreground mt-0.5">{comparison.label}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned Tickets</p>
              <p className="text-2xl font-bold text-blue-600">{assignedTickets}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SLA Success</p>
              <p className="text-2xl font-bold text-purple-600">{slaSuccessRate.toFixed(1)}%</p>
            </div>
          </div>
          {comparison && (
            <div className="text-right">
              {renderChangeIndicator(comparison.slaSuccessRate.change, true)}
              <p className="text-[10px] text-muted-foreground mt-0.5">{comparison.label}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MessageCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg First Response</p>
              <p className="text-2xl font-bold text-orange-600">{firstResponseTime || '0m'}</p>
            </div>
          </div>
          {comparison?.firstResponseTime && (
            <div className="text-right">
              {renderChangeIndicator(comparison.firstResponseTime.change, false, true)}
              <p className="text-[10px] text-muted-foreground mt-0.5">{comparison.label}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
