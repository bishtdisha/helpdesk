"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import { TeamDashboard } from './team-dashboard';
import { ComparativeAnalysisComponent } from './comparative-analysis';
import { ReportExportDialog } from './report-export-dialog';

export function AnalyticsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const isAdmin = user?.role?.name === 'Admin/Manager';
  const isTeamLeader = user?.role?.name === 'Team Leader';

  useEffect(() => {
    if (isTeamLeader) {
      fetchUserTeams();
    }
  }, [isTeamLeader]);

  const fetchUserTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
        if (data.length > 0 && !selectedTeamId) {
          setSelectedTeamId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const handleDateRangeChange = (range: { startDate: Date; endDate: Date }) => {
    setDateRange(range);
  };

  // Date range presets
  const setDateRangePreset = (days: number) => {
    setDateRange({
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600 dark:text-gray-400">Please log in to view analytics.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin && !isTeamLeader) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600 dark:text-gray-400">
            You do not have permission to view analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Date Range:</span>
              <span className="text-gray-600 dark:text-gray-400">
                {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRangePreset(7)}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRangePreset(30)}
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRangePreset(90)}
              >
                Last 90 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportDialogOpen(true)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin View - Comparative Analysis Only */}
      {isAdmin && (
        <ComparativeAnalysisComponent dateRange={dateRange} />
      )}

      {/* Team Leader View - Team Dashboard with Team Selector */}
      {isTeamLeader && !isAdmin && (
        <div className="space-y-6">
          {teams.length > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <label htmlFor="team-select" className="font-medium text-gray-700 dark:text-gray-300">
                    Select Team:
                  </label>
                  <select
                    id="team-select"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTeamId && (
            <TeamDashboard
              teamId={selectedTeamId}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
          )}
        </div>
      )}

      {/* Export Dialog */}
      <ReportExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />
    </div>
  );
}
