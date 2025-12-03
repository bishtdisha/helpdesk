'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Award } from "lucide-react";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function DailyTarget() {
  const { data, isLoading, error } = useSWR('/api/dashboard/performance/target', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Daily Target</CardTitle>
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
          <CardTitle className="text-base font-semibold">Daily Target</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-16 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { target, achieved, percentage } = data;
  const isComplete = percentage >= 100;
  const isOnTrack = percentage >= 75;

  return (
    <Card className={`hover:shadow-md transition-shadow h-full ${isComplete ? 'border-green-200 bg-gradient-to-br from-green-50/50 to-background' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Daily Target</CardTitle>
          {isComplete && (
            <Badge variant="default" className="bg-green-600">
              <Award className="h-3 w-3 mr-1" />
              Complete!
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${isComplete ? 'bg-green-100' : 'bg-blue-100'}`}>
              <Target className={`h-6 w-6 ${isComplete ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-3xl font-bold">{target}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Achieved</p>
            <p className={`text-3xl font-bold ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>
              {achieved}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className={`font-bold ${isComplete ? 'text-green-600' : isOnTrack ? 'text-blue-600' : 'text-orange-600'}`}>
              {percentage.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={Math.min(percentage, 100)} 
            className={`h-3 ${isComplete ? '[&>div]:bg-green-600' : isOnTrack ? '[&>div]:bg-blue-600' : '[&>div]:bg-orange-600'}`}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>{target}</span>
          </div>
        </div>

        {isComplete ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-sm font-medium text-green-700">🎉 Target achieved! Great work!</p>
          </div>
        ) : isOnTrack ? (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-sm font-medium text-blue-700">On track to meet target</p>
          </div>
        ) : (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
            <p className="text-sm font-medium text-orange-700">
              {target - achieved} more to reach target
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
