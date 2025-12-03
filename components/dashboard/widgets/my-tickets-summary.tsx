'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Clock, XCircle } from "lucide-react";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function MyTicketsSummary() {
  const { data, isLoading, error } = useSWR('/api/dashboard/my-tickets-summary', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">My Tickets</CardTitle>
          <CardDescription className="text-sm text-red-600">Failed to load data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">My Tickets</CardTitle>
          <CardDescription className="text-sm">Personal Performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { open, highPriority, urgent, avgOpenHours, failedEscalated } = data;

  const metrics = [
    {
      label: 'Open Tickets',
      value: open || 0,
      icon: AlertCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
    },
    {
      label: 'High Priority',
      value: highPriority || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200',
    },
    {
      label: 'Urgent',
      value: urgent || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
    },
    {
      label: 'Avg Open Hours',
      value: avgOpenHours ? `${avgOpenHours.toFixed(1)}h` : '0h',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200',
    },
    {
      label: 'Failed/Escalated',
      value: failedEscalated || 0,
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
    },
  ];

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">My Tickets</CardTitle>
        <CardDescription className="text-sm">Personal Performance Overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${metric.borderColor} bg-gradient-to-br from-background to-${metric.bgColor}/20 hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-md ${metric.bgColor}`}>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                  {index === 2 && metric.value > 0 && (
                    <Badge variant="destructive" className="text-xs">!</Badge>
                  )}
                </div>
                <div className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.label}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
