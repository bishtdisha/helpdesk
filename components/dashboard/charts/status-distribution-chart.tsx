'use client';

import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Lazy load Recharts
const PieChart = lazy(() => import('recharts').then(mod => ({ default: mod.PieChart })));
const Pie = lazy(() => import('recharts').then(mod => ({ default: mod.Pie })));
const Cell = lazy(() => import('recharts').then(mod => ({ default: mod.Cell })));
const Tooltip = lazy(() => import('recharts').then(mod => ({ default: mod.Tooltip })));
const ResponsiveContainer = lazy(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })));

interface StatusDistributionChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

function ChartSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-48 h-48 rounded-full bg-muted animate-pulse" />
    </div>
  );
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col !py-4 !gap-3 min-h-[380px]">
      <CardHeader className="!pb-2 !pt-2 !px-5">
        <CardTitle className="text-base font-semibold">Status Distribution</CardTitle>
        <CardDescription className="text-sm">Current breakdown</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 !px-4 !pb-4 flex flex-col min-h-[280px]">
        <div className="flex-1 min-h-[220px]">
          <Suspense fallback={<ChartSkeleton />}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={{
                    stroke: '#94a3b8',
                    strokeWidth: 1.5
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    fontSize: '13px',
                    padding: '8px 12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Suspense>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          {data.map((entry, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1.5 text-xs px-3 py-1.5 font-medium">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}: {entry.value}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
