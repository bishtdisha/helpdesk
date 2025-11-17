import { DashboardWidget, DashboardPreset, DashboardLayout } from '@/lib/types/dashboard';

// Available dashboard widgets
export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  {
    id: 'welcome',
    title: 'Welcome Message',
    component: 'WelcomeWidget',
    defaultSize: { w: 12, h: 3 },
    minSize: { w: 6, h: 2 },
    category: 'metrics',
    roles: ['Admin/Manager', 'Team Leader', 'User/Employee'],
    description: 'Personalized welcome message with user information',
  },
  {
    id: 'open-tickets',
    title: 'Open Tickets',
    component: 'MetricWidget',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    category: 'metrics',
    roles: ['Admin/Manager', 'Team Leader', 'User/Employee'],
    description: 'Count of currently open tickets',
  },
  {
    id: 'resolved-today',
    title: 'Resolved Today',
    component: 'MetricWidget',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    category: 'metrics',
    roles: ['Admin/Manager', 'Team Leader', 'User/Employee'],
    description: 'Number of tickets resolved today',
  },
  {
    id: 'avg-response-time',
    title: 'Avg Response Time',
    component: 'MetricWidget',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    category: 'metrics',
    roles: ['Admin/Manager', 'Team Leader', 'User/Employee'],
    description: 'Average response time for tickets',
  },
  {
    id: 'active-customers',
    title: 'Active Customers',
    component: 'MetricWidget',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    category: 'metrics',
    roles: ['Admin/Manager', 'Team Leader'],
    description: 'Number of active customers',
  },
  {
    id: 'weekly-activity',
    title: 'Weekly Ticket Activity',
    component: 'WeeklyActivityChart',
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 4 },
    category: 'charts',
    roles: ['Admin/Manager', 'Team Leader', 'User/Employee'],
    description: 'Bar chart showing weekly ticket activity',
  },
  {
    id: 'status-distribution',
    title: 'Ticket Status Distribution',
    component: 'StatusDistributionChart',
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 4 },
    category: 'charts',
    roles: ['Admin/Manager', 'Team Leader', 'User/Employee'],
    description: 'Pie chart showing ticket status distribution',
  },
  {
    id: 'recent-activity',
    title: 'Recent Activity',
    component: 'RecentActivityWidget',
    defaultSize: { w: 8, h: 6 },
    minSize: { w: 6, h: 4 },
    category: 'activity',
    roles: ['Admin/Manager', 'Team Leader', 'User/Employee'],
    description: 'List of recent ticket updates and system events',
  },
  {
    id: 'system-health',
    title: 'System Health',
    component: 'SystemHealthWidget',
    defaultSize: { w: 4, h: 6 },
    minSize: { w: 3, h: 4 },
    category: 'system',
    roles: ['Admin/Manager'],
    description: 'System status and health metrics',
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

// Preset layouts
export const DASHBOARD_PRESETS: DashboardPreset[] = [
  {
    id: 'admin-default',
    name: 'Admin Default',
    description: 'Default layout for administrators with all widgets',
    role: 'Admin/Manager',
    visibleWidgets: [
      'welcome',
      'open-tickets',
      'resolved-today',
      'avg-response-time',
      'active-customers',
      'weekly-activity',
      'status-distribution',
      'recent-activity',
    ],
    layout: [
      // Welcome message - reduced height
      { i: 'welcome', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
      
      // Metrics in one row - 4 widgets of 3 columns each
      { i: 'open-tickets', x: 0, y: 2, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'resolved-today', x: 3, y: 2, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'avg-response-time', x: 6, y: 2, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'active-customers', x: 9, y: 2, w: 3, h: 3, minW: 2, minH: 2 },
      
      // Charts in second row
      { i: 'weekly-activity', x: 0, y: 5, w: 6, h: 6, minW: 4, minH: 4 },
      { i: 'status-distribution', x: 6, y: 5, w: 6, h: 6, minW: 4, minH: 4 },
      
      // Bottom row - recent activity takes full width
      { i: 'recent-activity', x: 0, y: 11, w: 12, h: 6, minW: 6, minH: 4 },
    ],
  },
  {
    id: 'team-leader-default',
    name: 'Team Leader Default',
    description: 'Default layout for team leaders',
    role: 'Team Leader',
    visibleWidgets: [
      'welcome',
      'open-tickets',
      'resolved-today',
      'avg-response-time',
      'active-customers',
      'weekly-activity',
      'status-distribution',
      'recent-activity',
    ],
    layout: createDefaultLayout([
      'welcome',
      'open-tickets',
      'resolved-today',
      'avg-response-time',
      'active-customers',
      'weekly-activity',
      'status-distribution',
      'recent-activity',
    ]),
  },
  {
    id: 'user-default',
    name: 'User Default',
    description: 'Default layout for regular users',
    role: 'User/Employee',
    visibleWidgets: [
      'welcome',
      'open-tickets',
      'resolved-today',
      'avg-response-time',
      'weekly-activity',
      'status-distribution',
      'recent-activity',
    ],
    layout: createDefaultLayout([
      'welcome',
      'open-tickets',
      'resolved-today',
      'avg-response-time',
      'weekly-activity',
      'status-distribution',
      'recent-activity',
    ]),
  },
  {
    id: 'metrics-focused',
    name: 'Metrics Focused',
    description: 'Layout focused on key metrics and KPIs',
    role: 'all',
    visibleWidgets: [
      'open-tickets',
      'resolved-today',
      'avg-response-time',
      'active-customers',
      'weekly-activity',
      'status-distribution',
    ],
    layout: createDefaultLayout([
      'open-tickets',
      'resolved-today',
      'avg-response-time',
      'active-customers',
      'weekly-activity',
      'status-distribution',
    ]),
  },
  {
    id: 'activity-focused',
    name: 'Activity Focused',
    description: 'Layout focused on recent activity and updates',
    role: 'all',
    visibleWidgets: [
      'welcome',
      'recent-activity',
      'weekly-activity',
      'open-tickets',
      'resolved-today',
    ],
    layout: createDefaultLayout([
      'welcome',
      'recent-activity',
      'weekly-activity',
      'open-tickets',
      'resolved-today',
    ]),
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
    'User/Employee': 'user-default',
  };
  
  const presetId = roleToPresetId[role];
  return presetId ? DASHBOARD_PRESETS.find(preset => preset.id === presetId) : undefined;
}