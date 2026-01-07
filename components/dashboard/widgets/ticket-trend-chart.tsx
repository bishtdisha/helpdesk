'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function TicketTrendChart() {
  const [activePoint, setActivePoint] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const { data, isLoading, error } = useSWR('/api/dashboard/trends/tickets', fetcher, {
    refreshInterval: 300000, // 5 minutes
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Ticket Trend (30 Days)</CardTitle>
          <CardDescription className="text-sm text-red-600">Failed to load chart</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Ticket Trend (30 Days)</CardTitle>
          <CardDescription className="text-sm">Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const totalCreated = data.chartData?.reduce((sum: number, item: any) => sum + (item.created || 0), 0) || 0;
  const totalResolved = data.chartData?.reduce((sum: number, item: any) => sum + (item.resolved || 0), 0) || 0;
  const trend = totalCreated > 0 ? ((totalResolved - totalCreated) / totalCreated * 100) : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border-2 border-blue-200 shadow-xl">
          <p className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            {payload[0].payload.date}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                Created:
              </span>
              <span className="font-bold text-blue-600">{payload[0].value}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-green-600 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                Resolved:
              </span>
              <span className="font-bold text-green-600">{payload[1].value}</span>
            </div>
            <div className="pt-2 border-t mt-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-600">Net:</span>
                <span className={`font-bold ${payload[0].value - payload[1].value > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {payload[0].value - payload[1].value > 0 ? '+' : ''}{payload[0].value - payload[1].value}
                </span>
              </div>
            </div>
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
            <CardTitle className="text-base font-semibold">Ticket Trend (30 Days)</CardTitle>
            <CardDescription className="text-sm">Daily ticket creation and resolution</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={trend >= 0 ? "default" : "destructive"} className="text-xs">
              {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(trend).toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Created</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalCreated}</div>
          </div>
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="text-xs text-green-600 dark:text-green-400 mb-1">Total Resolved</div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{totalResolved}</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart 
            data={data.chartData}
            onMouseMove={(e: any) => {
              if (e && e.activePayload) {
                setActivePoint(e.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setActivePoint(null)}
          >
            <defs>
              <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Area 
              type="monotone" 
              dataKey="created" 
              stroke="#3b82f6" 
              strokeWidth={isHovered ? 3 : 2}
              fill="url(#colorCreated)"
              name="Created"
              dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff', className: 'animate-pulse' }}
              animationDuration={1000}
            />
            <Area 
              type="monotone" 
              dataKey="resolved" 
              stroke="#10b981" 
              strokeWidth={isHovered ? 3 : 2}
              fill="url(#colorResolved)"
              name="Resolved"
              dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff', className: 'animate-pulse' }}
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
