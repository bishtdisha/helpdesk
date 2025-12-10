'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Filter, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  success: boolean;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface AuditLogsResponse {
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Filters
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resourceType: '',
    resourceId: '',
    success: '',
    startDate: '',
    endDate: '',
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  // Fetch audit logs
  const fetchAuditLogs = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(appliedFilters).filter(([_, value]) => value !== '')
        ),
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data: AuditLogsResponse = await response.json();
      setLogs(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Reset filters
  const handleResetFilters = () => {
    const resetFilters = {
      userId: '',
      action: '',
      resourceType: '',
      resourceId: '',
      success: '',
      startDate: '',
      endDate: '',
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Export audit logs
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setExporting(true);
      const response = await fetch('/api/audit-logs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          ...appliedFilters,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    } finally {
      setExporting(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get action badge color
  const getActionBadgeColor = (action: string) => {
    if (action.includes('created')) return 'bg-green-500';
    if (action.includes('updated')) return 'bg-blue-500';
    if (action.includes('deleted')) return 'bg-red-500';
    if (action.includes('denied')) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  // Load initial data
  useEffect(() => {
    fetchAuditLogs(pagination.page);
  }, [appliedFilters, pagination.page]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            View and export system audit logs (Admin only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="action">Action</Label>
                <Input
                  id="action"
                  placeholder="e.g., created, updated"
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="resourceType">Resource Type</Label>
                <Input
                  id="resourceType"
                  placeholder="e.g., ticket, user"
                  value={filters.resourceType}
                  onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="resourceId">Resource ID</Label>
                <Input
                  id="resourceId"
                  placeholder="Resource ID"
                  value={filters.resourceId}
                  onChange={(e) => setFilters({ ...filters, resourceId: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="success">Status</Label>
                <select
                  id="success"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={filters.success}
                  onChange={(e) => setFilters({ ...filters, success: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="true">Success</option>
                  <option value="false">Failed</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleApplyFilters}>
                <Search className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={handleResetFilters}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <div className="ml-auto flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          {loading ? (
            <div className="text-center py-8">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <thead>
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        Timestamp
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        User
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        Action
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        Resource
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        Status
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b">
                        <td className="p-4 align-middle">
                          <div className="text-sm">
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="text-sm">
                            <div className="font-medium">
                              {log.user?.name || 'Unknown'}
                            </div>
                            <div className="text-muted-foreground">
                              {log.user?.email || log.userId || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="text-sm">
                            <div className="font-medium">{log.resourceType}</div>
                            {log.resourceId && (
                              <div className="text-muted-foreground text-xs">
                                {log.resourceId.substring(0, 8)}...
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={log.success ? 'default' : 'destructive'}>
                            {log.success ? 'Success' : 'Failed'}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="text-sm text-muted-foreground">
                            {log.ipAddress || 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {logs.length} of {pagination.total} audit logs
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAuditLogs(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAuditLogs(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
