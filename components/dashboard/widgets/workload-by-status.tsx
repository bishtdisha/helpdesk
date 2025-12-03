'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#ef4444',
  IN_PROGRESS: '#3b82f6',
  WAITING_FOR_CUSTOMER: '#f59e0b',
  RESOLVED: '#10b981',
  CLOSED: '#6b7280',
};

export function WorkloadByStatus() {
  const { data, isLoading, error } = useSWR('/api/dashboard/workload/status', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Pending Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Pending Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const { statusBreakdown } = data;

  const chartData = statusBreakdown.map((item: any) => ({
    name: item.status.replace(/_/g, ' '),
    value: item.count,
    color: STATUS_COLORS[item.status] || '#6b7280',
  }));

  const total = chartData.reduce((sum: number, item: any) => sum + item.value, 0);

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Pending Workload</CardTitle>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {chartData.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No pending tickets</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
