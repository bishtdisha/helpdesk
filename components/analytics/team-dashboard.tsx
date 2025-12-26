"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";
import { 
  Clock, CheckCircle, AlertCircle, Users, Download, TrendingUp, RefreshCw 
} from "lucide-react";
import { TeamMetrics } from '@/lib/services/analytics-service';
import { useAuth } from '@/lib/contexts/auth-context';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { DateRangePicker } from './date-range-picker';

interface TeamDashboardProps {
  teamId: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  onDateRangeChange?: (range: { startDate: Date; endDate: Date }) => void;
}

export function TeamDashboard({ teamId, dateRange, onDateRangeChange }: TeamDashboardProps) {
  const { user, role } = useAuth();
  const { canViewTeamAnalytics } = usePermissions();
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Permission check - Team_Leader or Admin_Manager only
  const hasPermission = canViewTeamAnalytics();

  // Validate team ID against user's assigned teams for Team_Leader
  const isValidTeamAccess = () => {
    if (role === 'Admin_Manager') {
      return true; // Admin can access any team
    }
    if (role === 'Team_Leader') {
      // Team Leader can only access their own team
      return user?.teamId === teamId;
    }
    return false;
  };

  useEffect(() => {
    if (teamId && hasPermission && isValidTeamAccess()) {
      fetchMetrics();
    }
  }, [teamId, dateRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      });

      const response = await fetch(`/api/analytics/teams/${teamId}?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 403) {
          throw new Error(errorData.message || 'Access denied. You do not have permission to view this team\'s analytics.');
        }
        if (response.status === 404) {
          throw new Error(errorData.message || 'Team not found.');
        }
        
        throw new Error(errorData.message || 'Failed to fetch team metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching team metrics:', err);
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
        teamId,
      });

      const response = await fetch(`/api/analytics/export?type=team&${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-report-${teamId}-${dateRange.startDate.toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting report:', err);
    }
  };

  const handleRefresh = () => {
    fetchMetrics();
  };

  // Permission check - must have team analytics permission
  if (!hasPermission) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Access denied. Only Team_Leader and Admin_Manager can view team analytics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Validate team access for Team_Leader
  if (!isValidTeamAccess()) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Access denied. You do not have permission to view this team&apos;s analytics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team metrics...</p>
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

  // Prepare workload distribution chart data
  const workloadData = metrics.workloadDistribution.map(agent => ({
    name: agent.agentName,
    open: agent.openTickets,
    inProgress: agent.inProgressTickets,
    total: agent.totalAssigned,
  }));

  return (
    <div className="space-y-6">
      {/* Header with Team Name and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{metrics.teamName} Dashboard</h2>
          <p className="text-muted-foreground">
            Team-specific performance metrics and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Range Display */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              Showing data from {dateRange.startDate.toLocaleDateString()} to {dateRange.endDate.toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

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
                <span className="text-green-600">Excellent</span>
              ) : metrics.slaComplianceRate >= 80 ? (
                <span className="text-orange-600">Good</span>
              ) : (
                <span className="text-red-600">Needs attention</span>
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
              ) : (
                <span className="text-orange-600">Fair</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-gray-700">Agent Performance</CardTitle>
            <CardDescription className="text-gray-500">
              Tickets assigned and resolved by team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.agentPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="agentName" 
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
                <Bar dataKey="assignedTickets" fill="#3b82f6" name="Assigned" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolvedTickets" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Workload Distribution */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-gray-700">Workload Distribution</CardTitle>
            <CardDescription className="text-gray-500">
              Current ticket assignments across team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workloadData}>
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
                <Bar dataKey="open" stackId="a" fill="#ef4444" name="Open" />
                <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" name="In Progress" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Details Table */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-gray-700">Agent Performance Details</CardTitle>
          <CardDescription className="text-gray-500">
            Detailed metrics for each team member (sorted by resolved tickets)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Agent</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    Assigned
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    Resolved
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    Avg Resolution Time
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Resolution Rate</th>
                </tr>
              </thead>
              <tbody>
                {metrics.agentPerformance
                  .sort((a, b) => b.resolvedTickets - a.resolvedTickets)
                  .map((agent, index) => {
                    const resolutionRate = agent.assignedTickets > 0 
                      ? (agent.resolvedTickets / agent.assignedTickets) * 100 
                      : 0;
                    
                    return (
                      <tr key={agent.agentId} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {index < 3 && (
                              <Badge variant="outline" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Top {index + 1}
                              </Badge>
                            )}
                            <span className="font-medium">{agent.agentName}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-gray-700">{agent.assignedTickets}</td>
                        <td className="text-right py-3 px-4 text-gray-700 font-medium">{agent.resolvedTickets}</td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          {agent.averageResolutionTime.toFixed(1)}h
                        </td>
                        <td className="text-right py-3 px-4">
                          <Badge 
                            variant={
                              resolutionRate >= 80 ? "default" :
                              resolutionRate >= 60 ? "secondary" :
                              "destructive"
                            }
                          >
                            {resolutionRate.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {metrics.agentPerformance.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No agent performance data available for this period.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workload Balance Summary */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-gray-700">Current Workload Balance</CardTitle>
          <CardDescription className="text-gray-500">
            Active ticket assignments per team member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.workloadDistribution
              .sort((a, b) => b.totalAssigned - a.totalAssigned)
              .map((agent) => {
                const maxWorkload = Math.max(...metrics.workloadDistribution.map(a => a.totalAssigned));
                const workloadPercentage = maxWorkload > 0 ? (agent.totalAssigned / maxWorkload) * 100 : 0;
                const isOverloaded = workloadPercentage > 80;
                
                return (
                  <div key={agent.agentId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{agent.agentName}</span>
                        {isOverloaded && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overloaded
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        {agent.totalAssigned} tickets
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          workloadPercentage > 80 ? 'bg-red-500' :
                          workloadPercentage > 60 ? 'bg-orange-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${workloadPercentage}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Open: {agent.openTickets}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        In Progress: {agent.inProgressTickets}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
          {metrics.workloadDistribution.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No workload data available for this period.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
