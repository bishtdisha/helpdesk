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
    <main id="main-content" className="space-y-6" role="main" aria-label="Dashboard">
      {/* Dashboard Grid - Simple CSS Grid */}
      <section 
        className="dashboard-grid-simple" 
        role="region" 
        aria-label="Dashboard widgets"
        aria-live="polite"
        aria-atomic="false"
      >
        {widgetsToShow.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 auto-rows-auto">
            {/* Section 1: High-Level KPIs - 4 cards in a row */}
            {['total-tickets-kpi', 'sla-compliance-kpi', 'avg-resolution-kpi', 'csat-kpi'].map(widgetId => 
              visibleWidgets.includes(widgetId) && (
                <div key={widgetId} className="col-span-1 md:col-span-1 lg:col-span-3">
                  <DashboardWidget
                    id={widgetId}
                    title={availableWidgets.find(w => w.id === widgetId)?.title || ''}
                    component={availableWidgets.find(w => w.id === widgetId)?.component || ''}
                    user={user}
                  />
                </div>
              )
            )}
            
            {/* Section 2: My Tickets Summary - Full Width */}
            {visibleWidgets.includes('my-tickets-summary') && (
              <div className="col-span-1 md:col-span-2 lg:col-span-12">
                <DashboardWidget
                  id="my-tickets-summary"
                  title="My Tickets"
                  component="MyTicketsSummary"
                  user={user}
                />
              </div>
            )}
            
            {/* Section 3: SLA Breach Alerts - Full Width */}
            {visibleWidgets.includes('sla-breach-alerts') && (
              <div className="col-span-1 md:col-span-2 lg:col-span-12">
                <DashboardWidget
                  id="sla-breach-alerts"
                  title="SLA / Priority Breakdown"
                  component="SLABreachAlerts"
                  user={user}
                />
              </div>
            )}
            
            {/* Section 4: Performance - 3 cards */}
            {['today-performance', 'week-performance', 'daily-target'].map(widgetId => 
              visibleWidgets.includes(widgetId) && (
                <div key={widgetId} className="col-span-1 md:col-span-1 lg:col-span-4">
                  <DashboardWidget
                    id={widgetId}
                    title={availableWidgets.find(w => w.id === widgetId)?.title || ''}
                    component={availableWidgets.find(w => w.id === widgetId)?.component || ''}
                    user={user}
                  />
                </div>
              )
            )}
            
            {/* Section 5: Trends - 3 charts */}
            {['ticket-trend', 'resolution-trend', 'sla-trend'].map(widgetId => 
              visibleWidgets.includes(widgetId) && (
                <div key={widgetId} className="col-span-1 md:col-span-1 lg:col-span-4">
                  <DashboardWidget
                    id={widgetId}
                    title={availableWidgets.find(w => w.id === widgetId)?.title || ''}
                    component={availableWidgets.find(w => w.id === widgetId)?.component || ''}
                    user={user}
                  />
                </div>
              )
            )}
            
            {/* Section 6: Extras - 3 cards */}
            {['workload-by-status', 'assigned-tickets-list', 'top-categories'].map(widgetId => 
              visibleWidgets.includes(widgetId) && (
                <div key={widgetId} className="col-span-1 md:col-span-1 lg:col-span-4">
                  <DashboardWidget
                    id={widgetId}
                    title={availableWidgets.find(w => w.id === widgetId)?.title || ''}
                    component={availableWidgets.find(w => w.id === widgetId)?.component || ''}
                    user={user}
                  />
                </div>
              )
            )}
          </div>
        ) : (
          // Show skeleton while layout initializes
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* KPI Cards */}
            <div className="col-span-1 md:col-span-1 lg:col-span-3 h-28 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-1 lg:col-span-3 h-28 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-1 lg:col-span-3 h-28 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-1 lg:col-span-3 h-28 bg-muted/50 animate-pulse rounded-lg" />
            
            {/* My Tickets Summary */}
            <div className="col-span-1 md:col-span-2 lg:col-span-12 h-40 bg-muted/50 animate-pulse rounded-lg" />
            
            {/* SLA Alerts */}
            <div className="col-span-1 md:col-span-2 lg:col-span-12 h-48 bg-muted/50 animate-pulse rounded-lg" />
            
            {/* Performance Cards */}
            <div className="col-span-1 md:col-span-1 lg:col-span-4 h-40 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-1 lg:col-span-4 h-40 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-1 lg:col-span-4 h-40 bg-muted/50 animate-pulse rounded-lg" />
            
            {/* Trend Charts */}
            <div className="col-span-1 md:col-span-1 lg:col-span-4 h-64 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-1 lg:col-span-4 h-64 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-1 lg:col-span-4 h-64 bg-muted/50 animate-pulse rounded-lg" />
            
            {/* Extras */}
            <div className="col-span-1 md:col-span-1 lg:col-span-4 h-64 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-1 lg:col-span-4 h-64 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-1 lg:col-span-4 h-64 bg-muted/50 animate-pulse rounded-lg" />
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