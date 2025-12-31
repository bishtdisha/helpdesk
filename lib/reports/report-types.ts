export type ReportType = 
  | 'ticket-summary'
  | 'sla-compliance'
  | 'agent-performance'
  | 'team-performance'
  | 'resolution-time'
  | 'aging-report'
  | 'workload-distribution'

export interface ReportDefinition {
  id: ReportType
  name: string
  description: string
  icon: string
  category: 'tickets' | 'performance' | 'sla' | 'workload'
  availableFor: ('Admin/Manager' | 'Team Leader' | 'User/Employee')[]
}

export interface ReportFilters {
  dateRange: {
    from: Date | null
    to: Date | null
  }
  teamId?: string
  assigneeId?: string
  status?: string[]
  priority?: string[]
}

export interface ReportData {
  generatedAt: Date
  filters: ReportFilters
  summary: Record<string, number | string>
  data: Record<string, unknown>[]
  charts?: ChartData[]
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area'
  title: string
  data: { name: string; value: number; [key: string]: unknown }[]
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'ticket-summary',
    name: 'Ticket Summary',
    description: 'Overview of all tickets with status breakdown and trends',
    icon: 'FileText',
    category: 'tickets',
    availableFor: ['Admin/Manager', 'Team Leader', 'User/Employee'],
  },
  {
    id: 'sla-compliance',
    name: 'SLA Compliance',
    description: 'SLA breach rates and compliance metrics by team and agent',
    icon: 'Clock',
    category: 'sla',
    availableFor: ['Admin/Manager', 'Team Leader'],
  },
  {
    id: 'agent-performance',
    name: 'Agent Performance',
    description: 'Individual agent metrics including resolution time and ticket count',
    icon: 'User',
    category: 'performance',
    availableFor: ['Admin/Manager', 'Team Leader'],
  },
  {
    id: 'team-performance',
    name: 'Team Performance',
    description: 'Team-level performance metrics and comparisons',
    icon: 'Users',
    category: 'performance',
    availableFor: ['Admin/Manager'],
  },
  {
    id: 'resolution-time',
    name: 'Resolution Time Analysis',
    description: 'Average resolution times by priority, category, and team',
    icon: 'Timer',
    category: 'performance',
    availableFor: ['Admin/Manager', 'Team Leader'],
  },
  {
    id: 'aging-report',
    name: 'Ticket Aging',
    description: 'Open tickets grouped by age to identify bottlenecks',
    icon: 'Calendar',
    category: 'tickets',
    availableFor: ['Admin/Manager', 'Team Leader'],
  },
  {
    id: 'workload-distribution',
    name: 'Workload Distribution',
    description: 'Ticket distribution across agents and teams',
    icon: 'BarChart3',
    category: 'workload',
    availableFor: ['Admin/Manager', 'Team Leader'],
  },
]
