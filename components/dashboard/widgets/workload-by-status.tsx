'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';
import { Badge } from "@/components/ui/badge";
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
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

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          className="drop-shadow-lg"
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 15}
          fill={fill}
          opacity={0.3}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percent = (payload[0].value / total * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border-2 shadow-xl" style={{ borderColor: payload[0].payload.color }}>
          <p className="font-semibold text-sm mb-2">{payload[0].name}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs">Count:</span>
              <span className="font-bold">{payload[0].value}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs">Percentage:</span>
              <span className="font-bold">{percent}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 h-full group">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Pending Workload</CardTitle>
          <Badge variant="outline" className="text-xs">
            Total: {total}
          </Badge>
        </div>
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
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  animationDuration={800}
                  animationBegin={0}
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="cursor-pointer transition-all hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {chartData.map((item: any, index: number) => (
                <div 
                  key={item.name} 
                  className={`flex items-center justify-between text-sm p-2 rounded-lg transition-all cursor-pointer ${
                    activeIndex === index ? 'bg-muted scale-105' : 'hover:bg-muted/50'
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full transition-transform"
                      style={{ 
                        backgroundColor: item.color,
                        transform: activeIndex === index ? 'scale(1.3)' : 'scale(1)'
                      }}
                    />
                    <span className={activeIndex === index ? 'font-semibold' : ''}>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${activeIndex === index ? 'text-lg' : ''}`}>{item.value}</span>
                    <span className="text-xs text-muted-foreground">
                      ({((item.value / total) * 100).toFixed(0)}%)
                    </span>
                  </div>
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
