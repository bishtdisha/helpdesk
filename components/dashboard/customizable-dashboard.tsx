'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardWidget } from './dashboard-widget';
import { useDashboardLayout } from '@/lib/hooks/use-dashboard-layout';
import { useAuth } from '@/lib/hooks/use-auth';
import { 
  getWidgetsForRole, 
  getDefaultPresetForRole 
} from '@/lib/dashboard-config';

export function CustomizableDashboard() {
  const { user } = useAuth();
  const {
    layout,
    visibleWidgets,
    isLoading,
    updateLayout,
    applyPreset,
  } = useDashboardLayout();

  // Get available widgets for current user role
  const availableWidgets = useMemo(() => {
    if (!user?.role?.name) return [];
    return getWidgetsForRole(user.role.name);
  }, [user?.role?.name]);

  // Initialize with default layout if no saved layout exists
  useEffect(() => {
    if (!isLoading && layout.length === 0 && visibleWidgets.length === 0 && user?.role?.name) {
      const defaultPreset = getDefaultPresetForRole(user.role.name);
      if (defaultPreset) {
        applyPreset(defaultPreset);
      }
    }
  }, [isLoading, layout.length, visibleWidgets.length, user?.role?.name, applyPreset]);

  // Filter widgets to show only visible ones
  const widgetsToShow = useMemo(() => {
    return availableWidgets.filter(widget => visibleWidgets.includes(widget.id));
  }, [availableWidgets, visibleWidgets]);

  return (
    <main id="main-content" className="space-y-4" role="main" aria-label="Dashboard">
      {/* Dashboard Header - Compact */}
      <header className="mb-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </header>

      {/* Dashboard Grid - Simple CSS Grid (No react-grid-layout) */}
      <section 
        className="dashboard-grid-simple" 
        role="region" 
        aria-label="Dashboard widgets"
        aria-live="polite"
        aria-atomic="false"
      >
        {widgetsToShow.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
            {/* Welcome Widget - Full Width */}
            {visibleWidgets.includes('welcome') && (
              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <DashboardWidget
                  id="welcome"
                  title="Welcome"
                  component="WelcomeWidget"
                  user={user}
                />
              </div>
            )}
            
            {/* Metric Widgets - 4 columns on desktop, 2 on tablet, 1 on mobile */}
            {['open-tickets', 'resolved-today', 'avg-response-time', 'active-customers'].map(widgetId => 
              visibleWidgets.includes(widgetId) && (
                <div key={widgetId} className="col-span-1">
                  <DashboardWidget
                    id={widgetId}
                    title={availableWidgets.find(w => w.id === widgetId)?.title || ''}
                    component={availableWidgets.find(w => w.id === widgetId)?.component || ''}
                    user={user}
                  />
                </div>
              )
            )}
            
            {/* Chart Widgets - 2 columns each on desktop, full width on mobile */}
            {visibleWidgets.includes('weekly-activity') && (
              <div className="col-span-1 md:col-span-2 lg:col-span-2 min-h-[380px]">
                <DashboardWidget
                  id="weekly-activity"
                  title="Weekly Ticket Activity"
                  component="WeeklyActivityChart"
                  user={user}
                />
              </div>
            )}
            
            {visibleWidgets.includes('status-distribution') && (
              <div className="col-span-1 md:col-span-2 lg:col-span-2 min-h-[380px]">
                <DashboardWidget
                  id="status-distribution"
                  title="Ticket Status Distribution"
                  component="StatusDistributionChart"
                  user={user}
                />
              </div>
            )}
            
            {/* Recent Activity - Full Width */}
            {visibleWidgets.includes('recent-activity') && (
              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <DashboardWidget
                  id="recent-activity"
                  title="Recent Activity"
                  component="RecentActivityWidget"
                  user={user}
                />
              </div>
            )}
          </div>
        ) : (
          // Show compact skeleton while layout initializes
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-1 md:col-span-2 lg:col-span-4 h-16 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 h-32 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 h-32 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 h-32 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 h-32 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-2 lg:col-span-2 h-80 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-2 lg:col-span-2 h-80 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-2 lg:col-span-4 h-64 bg-muted/50 animate-pulse rounded-lg" />
          </div>
        )}
      </section>



      {/* Custom CSS for simple grid layout */}
      <style jsx global>{`
        .dashboard-grid-simple {
          width: 100%;
        }
        
        .dashboard-grid-simple > div > div {
          height: 100%;
        }
      `}</style>
    </main>
  );
}