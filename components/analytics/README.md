# Analytics Dashboard Components

This directory contains the analytics dashboard components for the ticket management system with role-based access control.

## Components

### 1. OrganizationDashboard
**File:** `organization-dashboard.tsx`

**Purpose:** Displays organization-wide analytics and metrics for Admin/Manager users.

**Features:**
- System-wide KPIs (total tickets, resolution time, SLA compliance, customer satisfaction)
- Ticket distribution charts by priority and status
- Trend analysis with daily ticket volume and resolution trends
- Team performance comparison table
- Export functionality for organization reports

**Access:** Admin/Manager only

**Props:**
```typescript
interface OrganizationDashboardProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  onDateRangeChange?: (range: { startDate: Date; endDate: Date }) => void;
}
```

**API Endpoint:** `GET /api/analytics/organization`

---

### 2. TeamDashboard
**File:** `team-dashboard.tsx`

**Purpose:** Displays team-specific analytics and metrics for Team Leader users.

**Features:**
- Team-specific KPIs (total tickets, resolution time, SLA compliance, customer satisfaction)
- Agent performance charts showing assigned and resolved tickets
- Workload distribution visualization across team members
- Agent performance details table with resolution rates
- Current workload balance with visual progress bars
- Export functionality for team reports

**Access:** Team Leader (restricted to assigned teams) and Admin/Manager

**Props:**
```typescript
interface TeamDashboardProps {
  teamId: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  onDateRangeChange?: (range: { startDate: Date; endDate: Date }) => void;
}
```

**API Endpoint:** `GET /api/analytics/teams/:id`

---

### 3. ComparativeAnalysisComponent
**File:** `comparative-analysis.tsx`

**Purpose:** Provides cross-team performance comparison and insights for Admin/Manager users.

**Features:**
- Executive summary with overall metrics and top performing team
- Team rankings table with composite performance scores
- Multi-dimensional performance radar chart
- Performance trends showing improvement or decline
- Outlier identification (high performers and teams needing attention)
- Export functionality for comparative analysis reports

**Access:** Admin/Manager only

**Props:**
```typescript
interface ComparativeAnalysisProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}
```

**API Endpoint:** `GET /api/analytics/comparative`

---

### 4. ReportExportDialog
**File:** `report-export-dialog.tsx`

**Purpose:** Provides a dialog interface for exporting analytics reports in various formats.

**Features:**
- Report type selection (organization, team, agent, SLA, quality, comparative)
- Format selection (CSV, JSON)
- Date range selection
- Team and agent selection for specific report types
- Role-based report options (Admin sees all, Team Leader sees team-specific)
- Download functionality with automatic filename generation

**Access:** Admin/Manager and Team Leader (with restricted options)

**Props:**
```typescript
interface ReportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**API Endpoint:** `GET /api/analytics/export`

---

### 5. AnalyticsPage
**File:** `analytics-page.tsx`

**Purpose:** Main analytics page component that routes to appropriate dashboard based on user role.

**Features:**
- Date range selector with presets (7, 30, 90 days)
- Role-based routing:
  - Admin/Manager: Tabs for Organization Dashboard and Comparative Analysis
  - Team Leader: Team Dashboard with team selector (if multiple teams)
- Export dialog integration
- Automatic team fetching for Team Leaders

**Access:** Admin/Manager and Team Leader

**Usage:**
```tsx
import { AnalyticsPage } from '@/components/analytics';

export default function Analytics() {
  return <AnalyticsPage />;
}
```

---

## Data Flow

### Organization Metrics
1. Component fetches data from `/api/analytics/organization`
2. API validates user has Admin/Manager role
3. Analytics service calculates organization-wide metrics
4. Data includes:
   - Ticket counts and averages
   - SLA compliance rates
   - Customer satisfaction scores
   - Team performance summaries
   - Trend data points

### Team Metrics
1. Component fetches data from `/api/analytics/teams/:id`
2. API validates user has access to the specified team
3. Analytics service calculates team-specific metrics
4. Data includes:
   - Team ticket counts and averages
   - Agent performance summaries
   - Workload distribution
   - Team-specific SLA and satisfaction scores

### Comparative Analysis
1. Component fetches data from `/api/analytics/comparative`
2. API validates user has Admin/Manager role
3. Analytics service performs cross-team analysis
4. Data includes:
   - Team rankings with composite scores
   - Performance trends (improving/declining/stable)
   - Outlier identification
   - Executive summary

---

## Charts and Visualizations

### Used Libraries
- **Recharts**: For all chart visualizations
  - Bar charts for ticket distribution and agent performance
  - Pie charts for priority and status distribution
  - Line charts for trend analysis
  - Radar charts for multi-dimensional performance comparison

### Chart Types
1. **Bar Charts**: Agent performance, workload distribution, status distribution
2. **Pie Charts**: Priority distribution, status distribution
3. **Line Charts**: Ticket trends over time
4. **Radar Charts**: Multi-dimensional team performance comparison

---

## Role-Based Access Control

### Admin/Manager
- Full access to all analytics components
- Can view organization-wide metrics
- Can view comparative analysis
- Can view all team metrics
- Can export all report types

### Team Leader
- Access to team-specific analytics only
- Can view metrics for assigned teams
- Cannot view organization-wide metrics
- Cannot view comparative analysis
- Can export team and agent reports for assigned teams

### User/Employee
- No access to analytics components
- Redirected with permission denied message

---

## Styling and UI

### Design Patterns
- Consistent card-based layout
- Hover effects on interactive elements
- Color-coded badges for status indicators:
  - Green: Excellent/Good performance
  - Orange: Fair/Needs attention
  - Red: Poor/Critical
- Responsive grid layouts
- Loading states with spinners
- Error states with alert messages

### Color Scheme
- **Priority Colors:**
  - LOW: Green (#10b981)
  - MEDIUM: Orange (#f59e0b)
  - HIGH: Red (#ef4444)
  - URGENT: Dark Red (#dc2626)

- **Status Colors:**
  - OPEN: Red (#ef4444)
  - IN_PROGRESS: Orange (#f59e0b)
  - WAITING_FOR_CUSTOMER: Gray (#6b7280)
  - RESOLVED: Green (#10b981)
  - CLOSED: Blue (#3b82f6)

---

## Error Handling

All components include:
- Loading states during data fetching
- Error states with user-friendly messages
- Graceful fallbacks for missing data
- Console error logging for debugging

---

## Performance Considerations

1. **Data Caching**: Components fetch data on mount and when date range changes
2. **Lazy Loading**: Charts render only when visible
3. **Optimized Queries**: Backend uses indexed database queries
4. **Pagination**: Large datasets are paginated in tables
5. **Debouncing**: Date range changes are debounced to prevent excessive API calls

---

## Testing

### Manual Testing Checklist
- [ ] Admin can view organization dashboard
- [ ] Admin can view comparative analysis
- [ ] Team Leader can view team dashboard for assigned teams
- [ ] Team Leader cannot view organization dashboard
- [ ] User/Employee cannot access analytics
- [ ] Date range selector updates data correctly
- [ ] Export functionality downloads correct files
- [ ] Charts render correctly with real data
- [ ] Loading states display during data fetch
- [ ] Error states display on API failures

---

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live metrics
2. **Custom Date Ranges**: Calendar picker for custom date selection
3. **Saved Reports**: Ability to save and schedule reports
4. **More Chart Types**: Heatmaps, scatter plots, etc.
5. **Drill-down**: Click on charts to view detailed data
6. **Filters**: Additional filtering options (priority, status, etc.)
7. **Benchmarking**: Compare against historical data or industry standards
8. **Alerts**: Configurable alerts for metric thresholds

---

## Dependencies

- `recharts`: Chart library
- `lucide-react`: Icon library
- `@/components/ui/*`: UI component library
- `@/lib/hooks/use-auth`: Authentication hook
- `@/lib/services/analytics-service`: Analytics service types

---

## Related Files

- **API Routes:**
  - `app/api/analytics/organization/route.ts`
  - `app/api/analytics/teams/[id]/route.ts`
  - `app/api/analytics/comparative/route.ts`
  - `app/api/analytics/export/route.ts`

- **Services:**
  - `lib/services/analytics-service.ts`

- **Types:**
  - Defined in `lib/services/analytics-service.ts`
