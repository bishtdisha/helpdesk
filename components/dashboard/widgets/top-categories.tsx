'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tag } from "lucide-react";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function TopCategories() {
  const { data, isLoading, error } = useSWR('/api/dashboard/top-categories', fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Top Issue Categories</CardTitle>
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
          <CardTitle className="text-base font-semibold">Top Issue Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { categories, total } = data;

  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-700', progress: '[&>div]:bg-blue-600' },
    { bg: 'bg-purple-100', text: 'text-purple-700', progress: '[&>div]:bg-purple-600' },
    { bg: 'bg-green-100', text: 'text-green-700', progress: '[&>div]:bg-green-600' },
    { bg: 'bg-orange-100', text: 'text-orange-700', progress: '[&>div]:bg-orange-600' },
    { bg: 'bg-pink-100', text: 'text-pink-700', progress: '[&>div]:bg-pink-600' },
  ];

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Top Issue Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories && categories.length > 0 ? (
          categories.map((category: any, index: number) => {
            const colorScheme = colors[index % colors.length];
            return (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${colorScheme.bg}`}>
                      <Tag className={`h-3 w-3 ${colorScheme.text}`} />
                    </div>
                    <span className="text-sm font-medium">{category.name || 'Uncategorized'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                    <span className={`text-sm font-bold ${colorScheme.text}`}>
                      {category.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={category.percentage} 
                  className={`h-2 ${colorScheme.progress}`}
                />
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No category data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
