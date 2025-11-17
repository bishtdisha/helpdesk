"use client"

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from "recharts";
import { 
  TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, 
  Users, Download, RefreshCw
} from "lucide-react";
import { TicketPriority, TicketStatus } from '@prisma/client';
import { useOrganizationAnalytics } from '@/lib/hooks/use-organization-analytics';
import { DateRangePicker } from './date-range-picker';
import { usePermissions } from '@/lib/hooks/use-permissions';

interface OrganizationDashboardProps {
  className?: string;
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  URGENT: '#dc2626',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: '#ef4444',
  IN_PROGRESS: '#f59e0b',
  WAITING_FOR_CUSTOMER: '#6b7280',
  RESOLVED: '#10b981',
  CLOSED: '#3b82f6',
};

type SortField = 'totalTickets' | 'resolvedTickets' | 'averageResolutionTime' | 'slaComplianceRate';
type SortDirection = 'asc' | 'desc';

export function OrganizationDashboard({ className }: OrganizationDashboardProps) {
  // Check permissions - Admin_Manager only
  const { canViewOrganizationAnalytics } = usePermissions();

  // Initialize date range to last 30 days
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  // Sorting state for team performance table
  const [sortField, setSortField] = useState<SortField>('slaComplianceRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch organization metrics using custom hook
  const { metrics, isLoading: loading, error, refresh } = useOrganizationAnalytics({
    dateRange,
    refreshInterval: 300000, // Refresh every 5 minutes (less aggressive)
  });

  // Permission check
  if (!canViewOrganizationAnalytics()) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Access denied. Only Admin/Manager can view organization analytics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Memoized chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    if (!metrics) return null;

    const statusData = Object.entries(metrics.ticketsByStatus || {}).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
      color: STATUS_COLORS[status as TicketStatus] || '#6b7280',
    }));

    const priorityData = Object.entries(metrics.ticketsByPriority || {}).map(([priority, count]) => ({
      name: priority,
      value: count,
      color: PRIORITY_COLORS[priority as TicketPriority] || '#6b7280',
    }));

    const trendData = metrics.trends?.map(trend => ({
      date: new Date(trend.date).toLocaleDateString(),
      tickets: trend.ticketCount,
      resolved: trend.resolvedCount,
    })) || [];

    return { statusData, priorityData, trendData };
  }, [metrics]);

  // Memoized sorted team data
  const sortedTeams = useMemo(() => {
    if (!metrics?.teamPerformance) return [];

    return [...metrics.teamPerformance].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [metrics?.teamPerformance, sortField, sortDirection]);

  // Memoized handlers
  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        format: 'csv',
      });

      const response = await fetch(`/api/analytics/export?type=organization&${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `organization-report-${dateRange.startDate.toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting report:', err);
    }
  }, [dateRange]);

  const handleDateRangeChange = useCallback((newRange: { startDate: Date; endDate: Date }) => {
    setDateRange(newRange);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField, sortDirection]);



  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error.message || 'Failed to load analytics data'}</p>
            </div>
            <Button onClick={() => refresh()} variant="outline" size="sm" className="w-fit">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  // Prepare chart data
  const priorityData = Object.entries(metrics.ticketsByPriority).map(([priority, count]) => ({
    name: priority,
    value: count,
    color: PRIORITY_COLORS[priority as TicketPriority],
  }));

  const statusData = Object.entries(metrics.ticketsByStatus).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    value: count,
    color: STATUS_COLORS[status as TicketStatus],
  }));

  const teamData = metrics.teamPerformance.map((team) => ({
    name: team.teamName,
    tickets: team.totalTickets,
    resolved: team.resolvedTickets,
  }));

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header with Date Range Picker and Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Organization Dashboard</h2>
            <p className="text-muted-foreground">
              System-wide performance metrics and analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => refresh()} 
              variant="outline" 
              size="sm"
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center justify-between border-b pb-4">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{metrics.totalTickets}</div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.openTickets} open, {metrics.resolvedTickets} resolved
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {metrics.averageResolutionTime.toFixed(1)}h
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Response: {metrics.averageResponseTime.toFixed(1)}h
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">SLA Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {metrics.slaComplianceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.slaComplianceRate >= 90 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Excellent
                </span>
              ) : metrics.slaComplianceRate >= 80 ? (
                <span className="text-orange-600">Good</span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  Needs attention
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Customer Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {metrics.customerSatisfactionScore.toFixed(1)}/5
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.customerSatisfactionScore >= 4.5 ? (
                <span className="text-green-600">Excellent</span>
              ) : metrics.customerSatisfactionScore >= 4.0 ? (
                <span className="text-green-600">Good</span>
              ) : metrics.customerSatisfactionScore >= 3.5 ? (
                <span className="text-orange-600">Fair</span>
              ) : (
                <span className="text-red-600">Poor</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Distribution by Priority */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-gray-700">Tickets by Priority</CardTitle>
            <CardDescription className="text-gray-500">Distribution across priority levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ticket Distribution by Status */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-gray-700">Tickets by Status</CardTitle>
            <CardDescription className="text-gray-500">Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tickets by Team */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-gray-700">Tickets by Team</CardTitle>
          <CardDescription className="text-gray-500">Team workload distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Tickets" />
              <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

        {/* Trend Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-gray-700">Ticket Volume Trends</CardTitle>
              <CardDescription className="text-gray-500">
                Daily ticket creation and resolution trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalTickets" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Total Tickets"
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolvedTickets" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Resolved Tickets"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-gray-700">Resolution Time Trends</CardTitle>
              <CardDescription className="text-gray-500">
                Average resolution time over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="averageResolutionTime" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Avg Resolution Time (hours)"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Period Comparison */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-gray-700">Period Comparison</CardTitle>
            <CardDescription className="text-gray-500">
              Current period vs previous period performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Ticket Volume</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{metrics.totalTickets}</span>
                  <span className="text-sm text-gray-500">tickets</span>
                </div>
                <p className="text-xs text-gray-500">
                  Current period: {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Avg Resolution Time</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{metrics.averageResolutionTime.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">hours</span>
                </div>
                <p className="text-xs text-gray-500">
                  {metrics.averageResolutionTime < 24 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Excellent performance
                    </span>
                  ) : metrics.averageResolutionTime < 48 ? (
                    <span className="text-orange-600">Good performance</span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Needs improvement
                    </span>
                  )}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">SLA Compliance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{metrics.slaComplianceRate.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500">
                  {metrics.slaComplianceRate >= 90 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Exceeding target
                    </span>
                  ) : metrics.slaComplianceRate >= 80 ? (
                    <span className="text-orange-600">Meeting target</span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Below target
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance Comparison */}
        <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-gray-700">Team Performance Comparison</CardTitle>
          <CardDescription className="text-gray-500">
            Performance metrics across all teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Team</th>
                  <th 
                    className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('totalTickets')}
                  >
                    Total Tickets {sortField === 'totalTickets' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('resolvedTickets')}
                  >
                    Resolved {sortField === 'resolvedTickets' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('averageResolutionTime')}
                  >
                    Avg Resolution Time {sortField === 'averageResolutionTime' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('slaComplianceRate')}
                  >
                    SLA Compliance {sortField === 'slaComplianceRate' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team, index) => {
                  const isTopPerformer = index === 0 && sortField === 'slaComplianceRate' && sortDirection === 'desc';
                  const isBottomPerformer = index === sortedTeams.length - 1 && sortField === 'slaComplianceRate' && sortDirection === 'desc';
                  
                  return (
                    <tr 
                      key={team.teamId} 
                      className={`border-b hover:bg-gray-50 ${
                        isTopPerformer ? 'bg-green-50' : 
                        isBottomPerformer ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              isTopPerformer ? 'border-green-500 text-green-700' : 
                              isBottomPerformer ? 'border-red-500 text-red-700' : ''
                            }`}
                          >
                            #{index + 1}
                          </Badge>
                          <span className="font-medium">{team.teamName}</span>
                          {isTopPerformer && (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          )}
                          {isBottomPerformer && (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">{team.totalTickets}</td>
                      <td className="text-right py-3 px-4">{team.resolvedTickets}</td>
                      <td className="text-right py-3 px-4">{team.averageResolutionTime.toFixed(1)}h</td>
                      <td className="text-right py-3 px-4">
                        <Badge 
                          variant={
                            team.slaComplianceRate >= 90 ? "default" :
                            team.slaComplianceRate >= 80 ? "secondary" :
                            "destructive"
                          }
                        >
                          {team.slaComplianceRate.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
