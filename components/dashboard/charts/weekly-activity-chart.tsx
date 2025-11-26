'use client';

import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Lazy load Recharts to reduce initial bundle
const BarChart = lazy(() => import('recharts').then(mod => ({ default: mod.BarChart })));
const Bar = lazy(() => import('recharts').then(mod => ({ default: mod.Bar })));
const XAxis = lazy(() => import('recharts').then(mod => ({ default: mod.XAxis })));
const YAxis = lazy(() => import('recharts').then(mod => ({ default: mod.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(mod => ({ default: mod.Tooltip })));
const ResponsiveContainer = lazy(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })));

interface WeeklyActivityChartProps {
  data: Array<{ name: string; open: number; resolved: number }>;
}

function ChartSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="space-y-3 w-full">
        <div className="flex justify-between items-end h-40">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full bg-muted animate-pulse rounded-t" style={{ height: `${Math.random() * 100 + 40}px` }} />
              <div className="w-8 h-3 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col !py-4 !gap-3 min-h-[380px]">
      <CardHeader className="!pb-2 !pt-2 !px-5">
        <CardTitle className="text-base font-semibold">Weekly Ticket Activity</CardTitle>
        <CardDescription className="text-sm">Open vs Resolved</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 !px-4 !pb-4 min-h-[280px]">
        <Suspense fallback={<ChartSkeleton />}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                width={40}
              />
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
              <Bar dataKey="open" fill="#3b82f6" name="Open" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Suspense>
      </CardContent>
    </Card>
  );
}
