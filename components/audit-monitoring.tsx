'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  AlertTriangle, 
  Shield, 
  Activity, 
  Users, 
  TrendingUp,
  Eye,
  RefreshCw
} from 'lucide-react';

interface AuditStats {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  permissionViolations: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  topResources: Array<{ resourceType: string; count: number }>;
  recentViolations: Array<{
    userId: string;
    action: string;
    resourceType: string;
    timestamp: Date;
    user?: { name: string; email: string };
  }>;
}

interface AuditMonitoringProps {
  className?: string;
}

export function AuditMonitoring({ className }: AuditMonitoringProps) {
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    fetchAuditStats();
  }, [dateRange]);

  const fetchAuditStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(`/api/audit-logs/stats?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit statistics');
      }

      const data: AuditStats = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSuccessRate = () => {
    if (!stats || stats.totalActions === 0) return 0;
    return Math.round((stats.successfulActions / stats.totalActions) * 100);
  };

  const getViolationRate = () => {
    if (!stats || stats.totalActions === 0) return 0;
    return Math.round((stats.permissionViolations / stats.totalActions) * 100);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getViolationSeverity = (action: string) => {
    if (action.includes('delete') || action.includes('admin')) return 'high';
    if (action.includes('update') || action.includes('assign')) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading audit statistics...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Security Monitoring</h2>
          <p className="text-gray-600">Audit trail and permission violation monitoring</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchAuditStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {stats && (
        <>
          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Actions</p>
                    <p className="text-2xl font-bold">{stats.totalActions.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">{getSuccessRate()}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Violations</p>
                    <p className="text-2xl font-bold">{stats.permissionViolations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Violation Rate</p>
                    <p className="text-2xl font-bold">{getViolationRate()}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Most Common Actions</CardTitle>
                <CardDescription>Actions performed most frequently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topActions.slice(0, 10).map((item, index) => (
                    <div key={item.action} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 w-6">
                          {index + 1}.
                        </span>
                        <span className="text-sm font-medium">{item.action}</span>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Most Accessed Resources</CardTitle>
                <CardDescription>Resource types accessed most frequently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topResources.slice(0, 10).map((item, index) => (
                    <div key={item.resourceType} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 w-6">
                          {index + 1}.
                        </span>
                        <span className="text-sm font-medium capitalize">{item.resourceType}</span>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Permission Violations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    Recent Permission Violations
                  </CardTitle>
                  <CardDescription>
                    Latest security violations requiring attention
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stats.recentViolations.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentViolations.map((violation, index) => {
                    const severity = getViolationSeverity(violation.action);
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getSeverityColor(severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="destructive" className="text-xs">
                                VIOLATION
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {severity.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <strong>User:</strong> {violation.user?.name || 'Unknown'} ({violation.user?.email || 'N/A'})
                              </div>
                              <div>
                                <strong>Action:</strong> {violation.action}
                              </div>
                              <div>
                                <strong>Resource:</strong> {violation.resourceType}
                              </div>
                              <div>
                                <strong>Time:</strong> {formatTimestamp(violation.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No recent permission violations detected.</p>
                  <p className="text-sm">Your system security is operating normally.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {loading && stats && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Updating statistics...</span>
        </div>
      )}
    </div>
  );
}