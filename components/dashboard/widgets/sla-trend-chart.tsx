'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function SLATrendChart() {
  const { data, isLoading, error } = useSWR('/api/dashboard/trends/sla', fetcher, {
    refreshInterval: 300000, // 5 minutes
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">SLA Trend</CardTitle>
          <CardDescription className="text-sm text-red-600">Failed to load chart</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">SLA Trend</CardTitle>
          <CardDescription className="text-sm">Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">SLA Trend</CardTitle>
        <CardDescription className="text-sm">SLA compliance rate (%)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data.chartData}>
            <defs>
              <linearGradient id="colorSLA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }}
              stroke="#888"
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="#888"
              label={{ value: '%', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'SLA Rate']}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <ReferenceLine 
              y={90} 
              stroke="#10b981" 
              strokeDasharray="3 3"
              label={{ value: 'Target 90%', position: 'right', fontSize: 11, fill: '#10b981' }}
            />
            <ReferenceLine 
              y={80} 
              stroke="#f59e0b" 
              strokeDasharray="3 3"
              label={{ value: 'Warning 80%', position: 'right', fontSize: 11, fill: '#f59e0b' }}
            />
            <Area
              type="monotone"
              dataKey="slaRate"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorSLA)"
              name="SLA Compliance"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
