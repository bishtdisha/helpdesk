'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { DashboardWidget } from './dashboard-widget';
import { useDashboardLayout } from '@/lib/hooks/use-dashboard-layout';
import { useAuth } from '@/lib/hooks/use-auth';
import { 
  getWidgetsForRole, 
  getDefaultPresetForRole 
} from '@/lib/dashboard-config';
import { DashboardLayout } from '@/lib/types/dashboard';

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

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

  // Convert our layout format to react-grid-layout format
  const gridLayouts = useMemo(() => {
    const layouts: { [key: string]: Layout[] } = {};
    
    // Create layouts for different breakpoints
    ['lg', 'md', 'sm', 'xs', 'xxs'].forEach(breakpoint => {
      layouts[breakpoint] = layout.map(item => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
        maxW: item.maxW,
        maxH: item.maxH,
      }));
    });

    return layouts;
  }, [layout]);

  // Handle layout change
  const handleLayoutChange = (newLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    // Convert back to our format
    const dashboardLayout: DashboardLayout[] = newLayout.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
      maxW: item.maxW,
      maxH: item.maxH,
    }));

    updateLayout(dashboardLayout);
  };

  // Removed blocking loading state - render skeleton widgets instead

  return (
    <main id="main-content" className="space-y-4" role="main" aria-label="Dashboard">
      {/* Dashboard Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </header>

      {/* Dashboard Grid - Always render, show skeleton if loading */}
      <section 
        className="dashboard-grid" 
        role="region" 
        aria-label="Dashboard widgets"
        aria-live="polite"
        aria-atomic="false"
      >
        {widgetsToShow.length > 0 ? (
          <ResponsiveGridLayout
            className="layout"
            layouts={gridLayouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            onLayoutChange={handleLayoutChange}
            isDraggable={false}
            isResizable={false}
            useCSSTransforms={true}
          >
            {widgetsToShow.map(widget => (
              <div 
                key={widget.id} 
                className="dashboard-widget"
                role="article"
                aria-label={`${widget.title} widget`}
                tabIndex={0}
              >
                <DashboardWidget
                  id={widget.id}
                  title={widget.title}
                  component={widget.component}
                  user={user}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        ) : (
          // Show skeleton while layout initializes
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 h-32 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-3 h-48 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-3 h-48 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-3 h-48 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-3 h-48 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-6 h-96 bg-muted/50 animate-pulse rounded-lg" />
            <div className="col-span-6 h-96 bg-muted/50 animate-pulse rounded-lg" />
          </div>
        )}
      </section>



      {/* Custom CSS for grid layout */}
      <style jsx global>{`
        .dashboard-grid .react-grid-layout {
          position: relative;
        }
        
        .dashboard-grid .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top;
        }
        
        .dashboard-grid .react-grid-item.cssTransforms {
          transition-property: transform;
        }
        
        .dashboard-grid .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjODg4IiBkPSJtMTUgMTJjMCAuNTUyLS40NDggMS0xIDFzLTEtLjQ0OC0xLTEgLjQ0OC0xIDEtMSAxIC40NDggMSAxem0wIDRjMCAuNTUyLS40NDggMS0xIDFzLTEtLjQ0OC0xLTEgLjQ0OC0xIDEtMSAxIC40NDggMSAxem0wIDRjMCAuNTUyLS40NDggMS0xIDFzLTEtLjQ0OC0xLTEgLjQ0OC0xIDEtMSAxIC40NDggMSAxem0tNS00YzAtLjU1Mi40NDgtMSAxLTFzMSAuNDQ4IDEgMS0uNDQ4IDEtMSAxLTEtLjQ0OC0xLTF6bTAgNGMwLS41NTIuNDQ4LTEgMS0xczEgLjQ0OCAxIDEtLjQ0OCAxLTEgMS0xLS40NDgtMS0xem0wIDRjMC0uNTUyLjQ0OC0xIDEtMXMxIC40NDggMSAxLS40NDggMS0xIDEtMS0uNDQ4LTEtMXptLTUtNGMwLS41NTIuNDQ4LTEgMS0xczEgLjQ0OCAxIDEtLjQ0OCAxLTEgMS0xLS40NDgtMS0xem0wIDRjMC0uNTUyLjQ0OC0xIDEtMXMxIC40NDggMSAxLS40NDggMS0xIDEtMS0uNDQ4LTEtMXoiLz4KPHN2Zz4K') no-repeat;
          background-position: bottom right;
          padding: 0 3px 3px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
        }
        
        .dashboard-grid .react-grid-item.react-grid-placeholder {
          background: rgb(59 130 246 / 0.15);
          opacity: 0.2;
          transition-duration: 100ms;
          z-index: 2;
          user-select: none;
          border-radius: 8px;
          border: 2px dashed rgb(59 130 246 / 0.5);
        }
        
        .dashboard-widget {
          height: 100%;
          width: 100%;
        }
        
        .dashboard-widget > * {
          height: 100%;
        }
      `}</style>
    </main>
  );
}