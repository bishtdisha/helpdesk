export interface DashboardWidget {
  id: string;
  title: string;
  component: string;
  defaultSize: {
    w: number;
    h: number;
  };
  minSize?: {
    w: number;
    h: number;
  };
  maxSize?: {
    w: number;
    h: number;
  };
  category: 'metrics' | 'charts' | 'activity' | 'system';
  roles: ('Admin/Manager' | 'Team Leader' | 'User/Employee')[];
  description: string;
}

export interface DashboardLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface DashboardPreset {
  id: string;
  name: string;
  description: string;
  role: 'Admin/Manager' | 'Team Leader' | 'User/Employee' | 'all';
  layout: DashboardLayout[];
  visibleWidgets: string[];
}

export interface DashboardPreferences {
  layout: DashboardLayout[];
  visibleWidgets: string[];
  currentPreset?: string;
}