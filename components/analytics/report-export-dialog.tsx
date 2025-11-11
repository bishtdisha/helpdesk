"use client"

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, FileText, FileSpreadsheet, FileJson, AlertCircle } from "lucide-react";
import { useAuth } from '@/lib/hooks/use-auth';

interface ReportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ReportType = 'organization' | 'team' | 'agent' | 'sla' | 'quality' | 'comparative';
type ExportFormat = 'csv' | 'json';

export function ReportExportDialog({ open, onOpenChange }: ReportExportDialogProps) {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('organization');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [teamId, setTeamId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);

  // Determine available report types based on user role
  const isAdmin = user?.role?.name === 'Admin/Manager';
  const isTeamLeader = user?.role?.name === 'Team Leader';

  const availableReportTypes: Array<{ value: ReportType; label: string }> = [
    ...(isAdmin ? [
      { value: 'organization' as ReportType, label: 'Organization Report' },
      { value: 'comparative' as ReportType, label: 'Comparative Analysis' },
    ] : []),
    { value: 'team' as ReportType, label: 'Team Report' },
    { value: 'agent' as ReportType, label: 'Agent Report' },
    { value: 'sla' as ReportType, label: 'SLA Compliance Report' },
    { value: 'quality' as ReportType, label: 'Quality Metrics Report' },
  ];

  // Fetch teams when dialog opens
  useState(() => {
    if (open) {
      fetchTeams();
    }
  });

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const fetchAgents = async (selectedTeamId: string) => {
    try {
      const response = await fetch(`/api/teams/${selectedTeamId}/members`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  const handleTeamChange = (value: string) => {
    setTeamId(value);
    setAgentId('');
    if (value) {
      fetchAgents(value);
    } else {
      setAgents([]);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (reportType === 'team' && !teamId) {
        setError('Please select a team');
        return;
      }

      if (reportType === 'agent' && !agentId) {
        setError('Please select an agent');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        type: reportType,
        format,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });

      if (teamId) {
        params.append('teamId', teamId);
      }

      if (agentId) {
        params.append('agentId', agentId);
      }

      // Make export request
      const response = await fetch(`/api/analytics/export?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export report');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format === 'csv' ? 'csv' : 'json';
      a.download = `${reportType}-report-${timestamp}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Close dialog on success
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error exporting report:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFormatIcon = (fmt: ExportFormat) => {
    switch (fmt) {
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'json':
        return <FileJson className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Report
          </DialogTitle>
          <DialogDescription>
            Configure and download analytics reports in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type</Label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableReportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Team Selection (for team and agent reports) */}
          {(reportType === 'team' || reportType === 'agent') && (
            <div className="space-y-2">
              <Label htmlFor="team">Team {reportType === 'team' && '*'}</Label>
              <select
                id="team"
                value={teamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={reportType === 'team'}
              >
                <option value="">Select a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Agent Selection (for agent reports) */}
          {reportType === 'agent' && (
            <div className="space-y-2">
              <Label htmlFor="agent">Agent *</Label>
              <select
                id="agent"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!teamId}
                required
              >
                <option value="">Select an agent...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              {!teamId && (
                <p className="text-xs text-gray-500">Select a team first</p>
              )}
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-md transition-colors ${
                  format === 'csv'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="font-medium">CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-md transition-colors ${
                  format === 'json'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <FileJson className="h-4 w-4" />
                <span className="font-medium">JSON</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                {getFormatIcon(format)}
                Export Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
