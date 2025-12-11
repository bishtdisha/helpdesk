'use client';

/**
 * Example Interactive Widget
 * 
 * This is a template showing how to create interactive dashboard cards
 * with hover effects, tooltips, and expandable sections.
 * 
 * Copy this file and customize it for your needs!
 */

import { InteractiveCard } from "../interactive-card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Users, Target } from "lucide-react";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ExampleInteractiveWidget() {
  // Fetch your data
  const { data, isLoading, error } = useSWR('/api/your-endpoint', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  // Loading state
  if (isLoading || !data) {
    return (
      <InteractiveCard
        title="Loading..."
        icon={<Activity className="h-4 w-4 text-gray-500" />}
        hoverEffect="none"
      >
        <div className="h-20 bg-muted animate-pulse rounded" />
      </InteractiveCard>
    );
  }

  // Error state
  if (error) {
    return (
      <InteractiveCard
        title="Error"
        icon={<Activity className="h-4 w-4 text-red-500" />}
        className="border-red-200 bg-red-50/50"
        hoverEffect="none"
      >
        <p className="text-sm text-red-600">Failed to load data</p>
      </InteractiveCard>
    );
  }

  // Extract data
  const { mainValue, subValue, trend, detailedStats } = data;

  // Define expandable content
  const expandedContent = (
    <div className="space-y-3">
      {/* Grid of detailed metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">Active Users</span>
          </div>
          <div className="text-xl font-bold text-blue-700">
            {detailedStats?.activeUsers || 0}
          </div>
        </div>
        
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-600">Goal Progress</span>
          </div>
          <div className="text-xl font-bold text-green-700">
            {detailedStats?.goalProgress || 0}%
          </div>
        </div>
      </div>

      {/* Additional info */}
      <div className="text-xs text-muted-foreground text-center pt-2 border-t">
        Click to collapse detailed view
      </div>
    </div>
  );

  return (
    <InteractiveCard
      title="Example Metric"
      description="This is a sample interactive card"
      icon={
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
          <Activity className="h-4 w-4 text-purple-600" />
        </div>
      }
      tooltip="This card shows example data with interactive features. Click the arrow to expand for more details."
      hoverEffect="lift" // Options: 'lift', 'glow', 'scale', 'none'
      expandable={true}
      gradient="from-purple-50/50 to-background dark:from-purple-950/20 dark:to-background"
      className="border-purple-200 dark:border-purple-800"
      expandedContent={expandedContent}
    >
      {/* Main card content */}
      <div className="space-y-3">
        {/* Primary metric */}
        <div className="text-3xl font-bold text-purple-600">
          {mainValue || 0}
        </div>

        {/* Secondary info with badges */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
            {subValue || 0} active
          </Badge>
        </div>

        {/* Trend indicator */}
        {trend && trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className="h-3 w-3" />
            <span>{Math.abs(trend)}% from last period</span>
          </div>
        )}
      </div>
    </InteractiveCard>
  );
}

/**
 * CUSTOMIZATION GUIDE:
 * 
 * 1. Change the API endpoint in useSWR
 * 2. Update the icon and colors to match your metric
 * 3. Customize the expandedContent with your detailed data
 * 4. Choose a hover effect: 'lift', 'glow', 'scale', or 'none'
 * 5. Update the gradient and className for your color scheme
 * 6. Add your own badges, charts, or visualizations
 * 
 * COLOR SCHEMES:
 * - Blue: bg-blue-100, text-blue-600, border-blue-200
 * - Green: bg-green-100, text-green-600, border-green-200
 * - Orange: bg-orange-100, text-orange-600, border-orange-200
 * - Red: bg-red-100, text-red-600, border-red-200
 * - Purple: bg-purple-100, text-purple-600, border-purple-200
 * - Gray: bg-gray-100, text-gray-600, border-gray-200
 * 
 * HOVER EFFECTS:
 * - 'lift': Card elevates with shadow (best for KPIs)
 * - 'glow': Enhanced shadow with color (best for alerts)
 * - 'scale': Card grows slightly (best for clickable items)
 * - 'none': Minimal animation (best for dense layouts)
 */
