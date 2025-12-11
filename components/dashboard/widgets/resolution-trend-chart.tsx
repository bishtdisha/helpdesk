'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ResolutionTrendChart() {
  const [activePoint, setActivePoint] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const { data, isLoading, error } = useSWR('/api/dashboard/trends/resolution', fetcher, {
    refreshInterval: 300000, // 5 minutes
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Resolution Time Trend</CardTitle>
          <CardDescription className="text-sm text-red-600">Failed to load chart</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Resolution Time Trend</CardTitle>
          <CardDescription className="text-sm">Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const { chartData, targetHours } = data;

  // Calculate statistics
  const avgTime = chartData.reduce((sum: number, item: any) => sum + item.avgResolutionTime, 0) / chartData.length;
  const maxTime = Math.max(...chartData.map((item: any) => item.avgResolutionTime));
  const minTime = Math.min(...chartData.map((item: any) => item.avgResolutionTime));
  const trend = chartData.length > 1 
    ? ((chartData[chartData.length - 1].avgResolutionTime - chartData[0].avgResolutionTime) / chartData[0].avgResolutionTime * 100)
    : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const isAboveTarget = targetHours && value > targetHours;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border-2 border-amber-200 shadow-xl">
          <p className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            {payload[0].payload.date}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Resolution Time:
              </span>
              <span className="font-bold text-amber-600">{value.toFixed(1)}h</span>
            </div>
            {targetHours && (
              <div className="pt-2 border-t mt-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-gray-600">vs Target:</span>
                  <span className={`font-bold ${isAboveTarget ? 'text-red-600' : 'text-green-600'}`}>
                    {isAboveTarget ? '+' : ''}{(value - targetHours).toFixed(1)}h
                  </span>
                </div>
                <div className="text-xs text-center mt-1">
                  {isAboveTarget ? (
                    <span className="text-red-600">⚠️ Above target</span>
                  ) : (
                    <span className="text-green-600">✓ Within target</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 h-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Resolution Time Trend</CardTitle>
            <CardDescription className="text-sm">Average resolution time (hours)</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={trend <= 0 ? "default" : "destructive"} className="text-xs">
              {trend <= 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
              {Math.abs(trend).toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200">
            <div className="text-xs text-amber-600 mb-1">Average</div>
            <div className="text-lg font-bold text-amber-600">{avgTime.toFixed(1)}h</div>
          </div>
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200">
            <div className="text-xs text-green-600 mb-1">Best</div>
            <div className="text-lg font-bold text-green-600">{minTime.toFixed(1)}h</div>
          </div>
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200">
            <div className="text-xs text-red-600 mb-1">Worst</div>
            <div className="text-lg font-bold text-red-600">{maxTime.toFixed(1)}h</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart 
            data={chartData}
            onMouseMove={(e: any) => {
              if (e && e.activePayload) {
                setActivePoint(e.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setActivePoint(null)}
          >
            <defs>
              <linearGradient id="colorResolutionTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#fef3c7" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="opacity-50" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }}
              stroke="#888"
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              stroke="#888"
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            {targetHours && (
              <ReferenceLine 
                y={targetHours} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                strokeWidth={isHovered ? 3 : 2}
                label={{ 
                  value: `Target: ${targetHours}h`, 
                  position: 'right', 
                  fontSize: 11,
                  fill: '#ef4444',
                  fontWeight: 600
                }}
                className="transition-all"
              />
            )}
            <Area 
              type="monotone" 
              dataKey="avgResolutionTime" 
              stroke="#f59e0b" 
              strokeWidth={isHovered ? 3.5 : 2.5}
              fill="url(#colorResolutionTime)"
              name="Avg Resolution Time"
              dot={{ r: 3, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff', className: 'animate-pulse' }}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
        {activePoint && (
          <div className="mt-2 text-xs text-muted-foreground text-center animate-in fade-in duration-200">
            Hover over the chart to see daily details
          </div>
        )}
      </CardContent>
    </Card>
  );
}
