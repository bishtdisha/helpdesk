import { DashboardWidget, DashboardPreset, DashboardLayout } from '@/lib/types/dashboard';

// Available dashboard widgets
export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  // ⭐ Section 1: High-Level KPIs (Executive Summary)
  {
    id: 'total-tickets-kpi',
    title: 'Total Tickets',
    component: 'TotalTicketsKPI',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    category: 'kpi',
    roles: ['Admin/Manager', 'Team Leader', 'Employee'],
    description: 'Total tickets with open/resolved breakdown',
  },
  {
    id: 'sla-compliance-kpi',
    title: 'SLA Compliance',
    component: 'SLAComplianceKPI',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    category: 'kpi',
    roles: ['Admin/Manager', 'Team Leader', 'Employee'],
    description: 'SLA compliance percentage with status',
  },
  {
    id: 'avg-resolution-kpi',
    title: 'Avg Resolution Time',
    component: 'AvgResolutionKPI',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    category: 'kpi',
    roles: ['Admin/Manager', 'Team Leader', 'Employee'],
    description: 'Average resolution and response time',
  },
  {
    id: 'priority-mix-kpi',
    title: 'Priority Mix',
    component: 'PriorityMixKPI',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    category: 'kpi',
    roles: ['Admin/Manager', 'Team Leader', 'Employee'],
    description: 'Distribution of tickets by priority level',
  },
  // ⭐ Section 2: My Tickets (Personal Performance)
  {
    id: 'my-tickets-summary',
    title: 'My Tickets',
    component: 'MyTicketsSummary',
    defaultSize: { w: 12, h: 4 },
    minSize: { w: 6, h: 3 },
    category: 'personal',
    roles: ['Admin/Manager', 'Team Leader', 'Employee'],
    description: 'Open, High Priority, Urgent, Avg Hours, Failed/Escalated',
  },
  {
    id: 'following-tickets',
    title: 'Following',
    component: 'FollowingTicketsWidget',
    defaultSize: { w: 12, h: 4 },
    minSize: { w: 6, h: 3 },
    category: 'personal',
    roles: ['Admin/Manager', 'Team Leader', 'Employee'],
    description: 'Tickets you are following but not assigned to',
  },

  // ⭐ Section 3: SLA / Priority Breakdown
  {
    id: 'sla-breach-alerts',
    title: 'SLA Breach Alerts',
    component: 'SLABreachAlerts',
    defaultSize: { w: 12, h: 5 },
    minSize: { w: 6, h: 4 },
    category: 'sla',
    roles: ['Admin/Manager', 'Team Leader', 'Employee'],
    description: 'Near breach, breached, and priority vs SLA matrix',
  },

  // ⭐ Section 4: Day/Week Performance
  {
    id: 'today-performance',
    title: "Today's Performance",
    component: 'TodayPerformance',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    category: 'performance',
    roles: ['Admin/Manager', 'Team Leader', 'Employee'],
    description: 'Tickets resolved, assigned tickets, SLA success today',
  },
  // ⭐ Section 5: Trend Insights
  {
    id: 'ticket-trend',
    title: 'Ticket Trend (30 Days)',
    component: 'TicketTrendChart',
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 4 },
    category: 'trends',
    roles: ['Admin/Manager', 'Team Leader', 'Employee'],
    description: 'Ticket volume trend showing peak days',
  },
  {
    id: 'resolution-trend',
    title: 'Resolution Time Trend',
    component: 'ResolutionTrendChart',
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 4 },
    category: 'trends',
    roles: ['Admin/Manager', 'Team Leader', 'Employee'],
    description: 'Resolution time efficiency trend',
  },
  // ⭐ Section 6: Helpful Extras
  {
    id: 'workload-by-status',
    title: 'Pending Workload',
    component: 'WorkloadByStatus',
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 4 },
    category: 'extras',
    roles: ['Admin/Manager', 'Team Leader', 'Employee'],
    description: 'Tickets by status breakdown',
  },
];

// Default layouts for different roles
const createDefaultLayout = (widgets: string[]): DashboardLayout[] => {
  let currentY = 0;
  return widgets.map((widgetId, index) => {
    const widget = DASHBOARD_WIDGETS.find(w => w.id === widgetId);
    if (!widget) return null;

    const layout: DashboardLayout = {
      i: widgetId,
      x: (index * widget.defaultSize.w) % 12,
      y: currentY,
      w: widget.defaultSize.w,
      h: widget.defaultSize.h,
      minW: widget.minSize?.w,
      minH: widget.minSize?.h,
      maxW: widget.maxSize?.w,
      maxH: widget.maxSize?.h,
    };

    // Move to next row if widget doesn't fit
    if (layout.x + layout.w > 12) {
      currentY += Math.max(...widgets.slice(0, index).map(id => 
        DASHBOARD_WIDGETS.find(w => w.id === id)?.defaultSize.h || 3
      ));
      layout.x = 0;
      layout.y = currentY;
    }

    return layout;
  }).filter(Boolean) as DashboardLayout[];
};

// Preset layouts following the recommended structure
export const DASHBOARD_PRESETS: DashboardPreset[] = [
  {
    id: 'admin-default',
    name: 'Admin Default',
    description: 'Comprehensive executive dashboard',
    role: 'Admin/Manager',
    visibleWidgets: [
      // Section 1: High-Level KPIs
      'total-tickets-kpi',
      'sla-compliance-kpi',
      'avg-resolution-kpi',
      'priority-mix-kpi',
      // Section 2: My Tickets
      'my-tickets-summary',
      'following-tickets',
      // Section 3: SLA Breakdown
      'sla-breach-alerts',
      // Section 4: Performance
      'today-performance',
      // Section 5: Trends
      'ticket-trend',
      'resolution-trend',
      // Section 6: Extras
      'workload-by-status',
    ],
    layout: [
      // Row 1: High-Level KPIs (4 cards)
      { i: 'total-tickets-kpi', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'sla-compliance-kpi', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'avg-resolution-kpi', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'priority-mix-kpi', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      
      // Row 2: My Tickets Summary
      { i: 'my-tickets-summary', x: 0, y: 3, w: 12, h: 4, minW: 6, minH: 3 },
      
      // Row 3: Following Tickets
      { i: 'following-tickets', x: 0, y: 7, w: 12, h: 4, minW: 6, minH: 3 },
      
      // Row 4: SLA Breakdown & Today's Performance (side by side)
      { i: 'sla-breach-alerts', x: 0, y: 11, w: 6, h: 5, minW: 4, minH: 4 },
      { i: 'today-performance', x: 6, y: 11, w: 6, h: 5, minW: 4, minH: 3 },
      
      // Row 5: Trends (2 charts)
      { i: 'ticket-trend', x: 0, y: 16, w: 6, h: 5, minW: 4, minH: 4 },
      { i: 'resolution-trend', x: 6, y: 16, w: 6, h: 5, minW: 4, minH: 4 },
      
      // Row 6: Extras
      { i: 'workload-by-status', x: 0, y: 21, w: 12, h: 5, minW: 6, minH: 4 },
    ],
  },
  {
    id: 'team-leader-default',
    name: 'Team Leader Default',
    description: 'Team performance focused dashboard',
    role: 'Team Leader',
    visibleWidgets: [
      'total-tickets-kpi',
      'sla-compliance-kpi',
      'avg-resolution-kpi',
      'priority-mix-kpi',
      'my-tickets-summary',
      'following-tickets',
      'sla-breach-alerts',
      'today-performance',
      'daily-target',
      'ticket-trend',
      'resolution-trend',
      'workload-by-status',
    ],
    layout: [
      { i: 'total-tickets-kpi', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'sla-compliance-kpi', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'avg-resolution-kpi', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'priority-mix-kpi', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'my-tickets-summary', x: 0, y: 3, w: 12, h: 4, minW: 6, minH: 3 },
      { i: 'following-tickets', x: 0, y: 7, w: 12, h: 4, minW: 6, minH: 3 },
      { i: 'sla-breach-alerts', x: 0, y: 11, w: 6, h: 5, minW: 4, minH: 4 },
      { i: 'today-performance', x: 6, y: 11, w: 6, h: 5, minW: 4, minH: 3 },
      { i: 'daily-target', x: 0, y: 16, w: 12, h: 4, minW: 6, minH: 3 },
      { i: 'ticket-trend', x: 0, y: 20, w: 6, h: 5, minW: 4, minH: 4 },
      { i: 'resolution-trend', x: 6, y: 20, w: 6, h: 5, minW: 4, minH: 4 },
      { i: 'workload-by-status', x: 0, y: 25, w: 12, h: 5, minW: 6, minH: 4 },
    ],
  },
  {
    id: 'user-default',
    name: 'User Default',
    description: 'Personal performance dashboard',
    role: 'Employee',
    visibleWidgets: [
      'total-tickets-kpi',
      'sla-compliance-kpi',
      'avg-resolution-kpi',
      'priority-mix-kpi',
      'my-tickets-summary',
      'following-tickets',
      'sla-breach-alerts',
      'today-performance',
      'daily-target',
      'ticket-trend',
      'resolution-trend',
      'sla-trend',
      'workload-by-status',
    ],
    layout: [
      { i: 'total-tickets-kpi', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'sla-compliance-kpi', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'avg-resolution-kpi', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'priority-mix-kpi', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'my-tickets-summary', x: 0, y: 3, w: 12, h: 4, minW: 6, minH: 3 },
      { i: 'following-tickets', x: 0, y: 7, w: 12, h: 4, minW: 6, minH: 3 },
      { i: 'sla-breach-alerts', x: 0, y: 11, w: 6, h: 5, minW: 4, minH: 4 },
      { i: 'today-performance', x: 6, y: 11, w: 6, h: 5, minW: 4, minH: 3 },
      { i: 'daily-target', x: 0, y: 16, w: 12, h: 4, minW: 6, minH: 3 },
      { i: 'ticket-trend', x: 0, y: 20, w: 6, h: 5, minW: 4, minH: 4 },
      { i: 'resolution-trend', x: 6, y: 20, w: 6, h: 5, minW: 4, minH: 4 },
      { i: 'workload-by-status', x: 0, y: 25, w: 12, h: 5, minW: 6, minH: 4 },
    ],
  },
];

// Get widgets available for a specific role
export function getWidgetsForRole(role: string): DashboardWidget[] {
  return DASHBOARD_WIDGETS.filter(widget => 
    widget.roles.includes(role as any)
  );
}

// Get presets available for a specific role
export function getPresetsForRole(role: string): DashboardPreset[] {
  return DASHBOARD_PRESETS.filter(preset => 
    preset.role === role || preset.role === 'all'
  );
}

// Get default preset for a role
export function getDefaultPresetForRole(role: string): DashboardPreset | undefined {
  // Map role names to preset IDs
  const roleToPresetId: Record<string, string> = {
    'Admin/Manager': 'admin-default',
    'Team Leader': 'team-leader-default',
    'Employee': 'user-default',
  };
  
  const presetId = roleToPresetId[role];
  return presetId ? DASHBOARD_PRESETS.find(preset => preset.id === presetId) : undefined;
}
