"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from "recharts";
import { 
  TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, 
  Users, Download, Calendar 
} from "lucide-react";
import { OrganizationMetrics } from '@/lib/services/analytics-service';
import { TicketPriority, TicketStatus } from '@prisma/client';

interface OrganizationDashboardProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  onDateRangeChange?: (range: { startDate: Date; endDate: Date }) => void;
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

export function OrganizationDashboard({ dateRange, onDateRangeChange }: OrganizationDashboardProps) {
  const [metrics, setMetrics] = useState<OrganizationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      });

      const response = await fetch(`/api/analytics/organization?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch organization metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching organization metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
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
  };

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
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
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

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Organization Dashboard</h2>
          <p className="text-muted-foreground">
            System-wide performance metrics and analytics
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
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

      {/* Trend Analysis */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-gray-700">Ticket Trends</CardTitle>
          <CardDescription className="text-gray-500">
            Daily ticket volume and resolution trends
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
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Total Tickets</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Resolved</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Avg Resolution Time</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">SLA Compliance</th>
                </tr>
              </thead>
              <tbody>
                {metrics.teamPerformance
                  .sort((a, b) => b.slaComplianceRate - a.slaComplianceRate)
                  .map((team, index) => (
                    <tr key={team.teamId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="font-medium">{team.teamName}</span>
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
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
