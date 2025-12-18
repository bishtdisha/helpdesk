'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Clock, XCircle, User, TrendingUp, CheckCircle2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function MyTicketsSummary() {
  const [hoveredMetric, setHoveredMetric] = useState<number | null>(null);
  const [openPopover, setOpenPopover] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = (index: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredMetric(index);
    setOpenPopover(index);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredMetric(null);
      setOpenPopover(null);
    }, 100);
  };
  
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

  const { open, highPriority, urgent, avgOpenHours, failedEscalated, resolved, inProgress } = data;

  const metrics = [
    {
      label: 'Open Tickets',
      value: open || 0,
      icon: AlertCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
      tooltip: 'Total tickets currently assigned to you',
      details: `${inProgress || 0} in progress`,
      popoverContent: (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Open Tickets Breakdown</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded bg-blue-50 dark:bg-blue-950/20">
              <span className="text-xs">In Progress</span>
              <span className="font-bold text-blue-600">{inProgress || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-950/20">
              <span className="text-xs">Waiting</span>
              <span className="font-bold text-gray-600">{(open || 0) - (inProgress || 0)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Click on a ticket to view details
          </p>
        </div>
      ),
    },
    {
      label: 'High Priority',
      value: highPriority || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200',
      tooltip: 'High priority tickets requiring attention',
      details: 'Needs quick response',
      popoverContent: (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">High Priority Details</h4>
          <div className="p-3 rounded bg-orange-50 dark:bg-orange-950/20 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Action Required</span>
            </div>
            <p className="text-xs text-muted-foreground">
              These tickets need quick response and resolution to meet SLA requirements.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            Recommended response time: <span className="font-semibold">Within 4 hours</span>
          </div>
        </div>
      ),
    },
    {
      label: 'Urgent',
      value: urgent || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      tooltip: 'Critical tickets requiring immediate action',
      details: 'Immediate action needed',
      popoverContent: (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-red-600">🚨 Urgent Tickets</h4>
          <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />
              <span className="text-sm font-medium text-red-700">Critical Priority</span>
            </div>
            <p className="text-xs text-muted-foreground">
              These tickets require immediate attention and should be addressed first.
            </p>
          </div>
          <div className="text-xs text-red-600 font-semibold">
            ⚡ Respond immediately!
          </div>
        </div>
      ),
    },
    {
      label: 'Avg Open Hours',
      value: avgOpenHours ? `${avgOpenHours.toFixed(1)}h` : '0h',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200',
      tooltip: 'Average time tickets have been open',
      details: 'Time management metric',
      popoverContent: (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Time Management</h4>
          <div className="space-y-2">
            <div className="p-2 rounded bg-purple-50 dark:bg-purple-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">Average Open Time</span>
                <span className="font-bold text-purple-600">{avgOpenHours ? `${avgOpenHours.toFixed(1)}h` : '0h'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-purple-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min((avgOpenHours || 0) / 48 * 100, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {avgOpenHours && avgOpenHours < 24 
                ? '✅ Good response time' 
                : avgOpenHours && avgOpenHours < 48 
                ? '⚠️ Consider prioritizing older tickets' 
                : '🔴 Some tickets need attention'}
            </p>
          </div>
        </div>
      ),
    },
    {
      label: 'Failed/Escalated',
      value: failedEscalated || 0,
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      tooltip: 'Tickets that were escalated or failed',
      details: 'Requires review',
      popoverContent: (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Escalated Tickets</h4>
          <div className="p-3 rounded bg-gray-50 dark:bg-gray-950/20 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Review Required</span>
            </div>
            <p className="text-xs text-muted-foreground">
              These tickets were escalated to higher support levels or marked as failed.
            </p>
          </div>
          {failedEscalated === 0 && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>Great job! No escalations</span>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card className="hover:shadow-lg transition-all duration-300 h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-gray-800 dark:text-gray-100">My Tickets</CardTitle>
            <CardDescription className="text-sm font-medium text-gray-500 dark:text-gray-400">Personal Performance Overview</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const isHovered = hoveredMetric === index;
            
            return (
              <Popover key={index} open={openPopover === index} onOpenChange={(open) => !open && setOpenPopover(null)}>
                <PopoverTrigger asChild>
                  <div
                    onMouseEnter={() => handleMouseEnter(index)}
                    onMouseLeave={handleMouseLeave}
                    className={`p-4 rounded-lg border ${metric.borderColor} bg-gradient-to-br from-background to-${metric.bgColor}/20 hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden`}
                  >
                    {/* Animated background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ${isHovered ? 'translate-x-full' : '-translate-x-full'}`} />
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-md ${metric.bgColor} transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
                          <Icon className={`h-4 w-4 ${metric.color}`} />
                        </div>
                        {index === 2 && metric.value > 0 && (
                          <Badge variant="destructive" className="text-xs animate-pulse">!</Badge>
                        )}
                      </div>
                      <div className={`text-2xl font-extrabold ${metric.color} transition-all duration-300 ${isHovered ? 'scale-110' : ''}`}>
                        {metric.value}
                      </div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-1">
                        {metric.label}
                      </p>

                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-72 p-4 z-[100] shadow-2xl border-2 bg-background/95 backdrop-blur-sm"
                  side="bottom"
                  align="center"
                  sideOffset={10}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  {metric.popoverContent}
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
        {resolved !== undefined && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-bold text-green-700">Resolved Today</span>
              </div>
              <span className="text-xl font-extrabold text-green-600">{resolved || 0}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
