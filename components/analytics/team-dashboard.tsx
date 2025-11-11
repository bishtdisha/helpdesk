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
  Clock, CheckCircle, AlertCircle, Users, Download, TrendingUp 
} from "lucide-react";
import { TeamMetrics } from '@/lib/services/analytics-service';

interface TeamDashboardProps {
  teamId: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  onDateRangeChange?: (range: { startDate: Date; endDate: Date }) => void;
}

export function TeamDashboard({ teamId, dateRange, onDateRangeChange }: TeamDashboardProps) {
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamId) {
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
      {/* Header with Team Name and Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{metrics.teamName} Dashboard</h2>
          <p className="text-muted-foreground">
            Team-specific performance metrics and analytics
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
            Detailed metrics for each team member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Agent</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Assigned</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Resolved</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Avg Resolution Time</th>
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
                      <tr key={agent.agentId} className="border-b hover:bg-gray-50">
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
                        <td className="text-right py-3 px-4">{agent.assignedTickets}</td>
                        <td className="text-right py-3 px-4">{agent.resolvedTickets}</td>
                        <td className="text-right py-3 px-4">
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
                
                return (
                  <div key={agent.agentId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{agent.agentName}</span>
                      <span className="text-sm text-gray-600">
                        {agent.totalAssigned} tickets
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          workloadPercentage > 80 ? 'bg-red-500' :
                          workloadPercentage > 60 ? 'bg-orange-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${workloadPercentage}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>Open: {agent.openTickets}</span>
                      <span>In Progress: {agent.inProgressTickets}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
