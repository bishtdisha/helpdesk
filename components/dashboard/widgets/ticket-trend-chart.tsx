'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function TicketTrendChart() {
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

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Ticket Trend (30 Days)</CardTitle>
        <CardDescription className="text-sm">Daily ticket creation and resolution</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }}
              stroke="#888"
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              stroke="#888"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey="created" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Created"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="resolved" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Resolved"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
