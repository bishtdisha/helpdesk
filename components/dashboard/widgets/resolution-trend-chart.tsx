'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
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
          <LineChart data={chartData}>
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
                fontSize: '12px'
              }}
              formatter={(value: number) => [`${value.toFixed(1)}h`, 'Avg Time']}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            {targetHours && (
              <ReferenceLine 
                y={targetHours} 
                stroke="#ef4444" 
                strokeDasharray="3 3"
                label={{ value: 'Target', position: 'right', fontSize: 11 }}
              />
            )}
            <Line 
              type="monotone" 
              dataKey="avgResolutionTime" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Avg Resolution Time"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
