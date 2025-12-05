'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ResolutionTrendChart() {
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

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Resolution Time Trend</CardTitle>
        <CardDescription className="text-sm">Average resolution time (hours)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <defs>
              {/* Gradient for Resolution Time - Green to Yellow to Orange */}
              <linearGradient id="colorResolutionTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#fef3c7" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              formatter={(value: number) => [`${value.toFixed(1)}h`, 'Avg Resolution Time']}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            {targetHours && (
              <ReferenceLine 
                y={targetHours} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ 
                  value: `Target: ${targetHours}h`, 
                  position: 'right', 
                  fontSize: 11,
                  fill: '#ef4444',
                  fontWeight: 600
                }}
              />
            )}
            <Area 
              type="monotone" 
              dataKey="avgResolutionTime" 
              stroke="#f59e0b" 
              strokeWidth={2.5}
              fill="url(#colorResolutionTime)"
              name="Avg Resolution Time"
              dot={{ r: 3, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
