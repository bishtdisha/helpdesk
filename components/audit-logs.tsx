'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Filter, Download, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { AuditLogEntry, AuditLogFilter, AuditLogResult } from '@/lib/types/rbac';

interface AuditLogsProps {
  className?: string;
}

export function AuditLogs({ className }: AuditLogsProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLogResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<AuditLogFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  // Filter form state
  const [filterForm, setFilterForm] = useState({
    userId: '',
    action: '',
    resourceType: '',
    success: '',
    startDate: '',
    endDate: '',
    ipAddress: '',
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      });

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data: AuditLogResult = await response.json();
      setAuditLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newFilters: AuditLogFilter = {};
    
    if (filterForm.userId) newFilters.userId = filterForm.userId;
    if (filterForm.action) newFilters.action = filterForm.action;
    if (filterForm.resourceType) newFilters.resourceType = filterForm.resourceType;
    if (filterForm.success) newFilters.success = filterForm.success === 'true';
    if (filterForm.startDate) newFilters.startDate = new Date(filterForm.startDate);
    if (filterForm.endDate) newFilters.endDate = new Date(filterForm.endDate);
    if (filterForm.ipAddress) newFilters.ipAddress = filterForm.ipAddress;

    setFilters(newFilters);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterForm({
      userId: '',
      action: '',
      resourceType: '',
      success: '',
      startDate: '',
      endDate: '',
      ipAddress: '',
    });
    setFilters({});
    setCurrentPage(1);
  };

  const exportAuditLogs = async () => {
    try {
      const params = new URLSearchParams();
      
      // Add current filters to export
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });

      // Add export flag and larger limit
      params.append('export', 'true');
      params.append('limit', '1000');

      const response = await fetch(`/api/audit-logs?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }

      const data = await response.json();
      
      // Convert to CSV and download
      const csv = convertToCSV(data.logs);
      downloadCSV(csv, 'audit-logs.csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const convertToCSV = (logs: AuditLogEntry[]): string => {
    const headers = [
      'Timestamp',
      'User',
      'Email',
      'Role',
      'Action',
      'Resource Type',
      'Resource ID',
      'Success',
      'IP Address',
      'Details'
    ];

    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.user?.name || 'System',
      log.user?.email || '',
      log.user?.role?.name || '',
      log.action,
      log.resourceType,
      log.resourceId || '',
      log.success ? 'Yes' : 'No',
      log.ipAddress || '',
      JSON.stringify(log.details || {})
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('create')) return 'default';
    if (action.includes('update')) return 'secondary';
    if (action.includes('delete')) return 'destructive';
    if (action.includes('violation')) return 'destructive';
    return 'outline';
  };

  const getSuccessIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  if (loading && !auditLogs) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading audit logs...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Security and compliance audit trail for system activities
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAuditLogs}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showFilters && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Filter Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFilterSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="userId">User ID</Label>
                      <Input
                        id="userId"
                        value={filterForm.userId}
                        onChange={(e) => setFilterForm(prev => ({ ...prev, userId: e.target.value }))}
                        placeholder="Filter by user ID"
                      />
                    </div>

                    <div>
                      <Label htmlFor="action">Action</Label>
                      <Input
                        id="action"
                        value={filterForm.action}
                        onChange={(e) => setFilterForm(prev => ({ ...prev, action: e.target.value }))}
                        placeholder="Filter by action"
                      />
                    </div>

                    <div>
                      <Label htmlFor="resourceType">Resource Type</Label>
                      <Select
                        value={filterForm.resourceType}
                        onValueChange={(value) => setFilterForm(prev => ({ ...prev, resourceType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All resource types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All resource types</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="team">Team</SelectItem>
                          <SelectItem value="role">Role</SelectItem>
                          <SelectItem value="ticket">Ticket</SelectItem>
                          <SelectItem value="authentication">Authentication</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="success">Success Status</Label>
                      <Select
                        value={filterForm.success}
                        onValueChange={(value) => setFilterForm(prev => ({ ...prev, success: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All statuses</SelectItem>
                          <SelectItem value="true">Success</SelectItem>
                          <SelectItem value="false">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={filterForm.startDate}
                        onChange={(e) => setFilterForm(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={filterForm.endDate}
                        onChange={(e) => setFilterForm(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="ipAddress">IP Address</Label>
                      <Input
                        id="ipAddress"
                        value={filterForm.ipAddress}
                        onChange={(e) => setFilterForm(prev => ({ ...prev, ipAddress: e.target.value }))}
                        placeholder="Filter by IP address"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      <Search className="h-4 w-4 mr-2" />
                      Apply Filters
                    </Button>
                    <Button type="button" variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {auditLogs && (
            <>
              <div className="space-y-4">
                {auditLogs.logs.map((log) => (
                  <Card key={log.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getSuccessIcon(log.success)}
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action}
                            </Badge>
                            <Badge variant="outline">
                              {log.resourceType}
                            </Badge>
                            {log.resourceId && (
                              <Badge variant="secondary">
                                ID: {log.resourceId}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>User:</strong> {log.user?.name || 'System'} ({log.user?.email || 'N/A'})
                            </div>
                            <div>
                              <strong>Role:</strong> {log.user?.role?.name || 'N/A'}
                            </div>
                            <div>
                              <strong>Timestamp:</strong> {formatTimestamp(log.timestamp)}
                            </div>
                            <div>
                              <strong>IP Address:</strong> {log.ipAddress || 'N/A'}
                            </div>
                          </div>

                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="mt-3">
                              <strong className="text-sm">Details:</strong>
                              <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {auditLogs.logs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No audit logs found matching the current filters.
                </div>
              )}

              {auditLogs.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {auditLogs.logs.length} of {auditLogs.pagination.totalCount} entries
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!auditLogs.pagination.hasPreviousPage}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-1 text-sm">
                      Page {auditLogs.pagination.currentPage} of {auditLogs.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!auditLogs.pagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {loading && auditLogs && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}