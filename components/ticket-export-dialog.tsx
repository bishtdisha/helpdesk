"use client"

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Download, FileSpreadsheet, AlertCircle, Loader2 } from "lucide-react";
import { TicketFilters } from '@/lib/types/ticket';
import { toast } from 'sonner';

interface TicketExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilters?: TicketFilters;
}

interface ColumnConfig {
  id: string;
  label: string;
  enabled: boolean;
}

export function TicketExportDialog({ open, onOpenChange, currentFilters }: TicketExportDialogProps) {
  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Column selection state
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'id', label: 'Ticket ID', enabled: true },
    { id: 'title', label: 'Title', enabled: true },
    { id: 'description', label: 'Description', enabled: true },
    { id: 'status', label: 'Status', enabled: true },
    { id: 'priority', label: 'Priority', enabled: true },
    { id: 'customer', label: 'Customer', enabled: true },
    { id: 'assignee', label: 'Assignee', enabled: true },
    { id: 'team', label: 'Team', enabled: true },
    { id: 'category', label: 'Category', enabled: true },
    { id: 'createdAt', label: 'Created Date', enabled: true },
    { id: 'updatedAt', label: 'Updated Date', enabled: true },
    { id: 'resolvedAt', label: 'Resolved Date', enabled: false },
    { id: 'closedAt', label: 'Closed Date', enabled: false },
  ]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Toggle column selection
  const toggleColumn = (columnId: string) => {
    setColumns(prev => 
      prev.map(col => 
        col.id === columnId ? { ...col, enabled: !col.enabled } : col
      )
    );
  };

  // Select/deselect all columns
  const toggleAllColumns = (enabled: boolean) => {
    setColumns(prev => prev.map(col => ({ ...col, enabled })));
  };

  // Handle cancel
  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
      setProgress(0);
      setError('Export cancelled');
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      // Validate at least one column is selected
      const selectedColumns = columns.filter(col => col.enabled);
      if (selectedColumns.length === 0) {
        setError('Please select at least one column to export');
        setLoading(false);
        return;
      }

      // Build request body
      const requestBody = {
        reportType: 'tickets',
        format: 'csv',
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        columns: selectedColumns.map(col => col.id),
        filters: currentFilters || {},
      };

      // Create abort controller for cancellation
      const controller = new AbortController();
      setAbortController(controller);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Make export request
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearInterval(progressInterval);
      setProgress(100);
      setAbortController(null);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export tickets');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `tickets-export-${timestamp}.csv`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success message
      toast.success('Export completed successfully', {
        description: `Tickets exported to CSV file`,
      });

      // Close dialog on success
      setTimeout(() => {
        onOpenChange(false);
        setProgress(0);
      }, 500);
    } catch (err) {
      // Check if error is due to abort
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Export cancelled');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred during export');
      }
      console.error('Error exporting tickets:', err);
      setProgress(0);
      setAbortController(null);
    } finally {
      setLoading(false);
    }
  };

  // Count selected columns
  const selectedCount = columns.filter(col => col.enabled).length;
  const allSelected = selectedCount === columns.length;
  const noneSelected = selectedCount === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Tickets
          </DialogTitle>
          <DialogDescription>
            Export tickets to CSV format with your selected columns and date range
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Date Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Column Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Select Columns ({selectedCount} of {columns.length})
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAllColumns(true)}
                  disabled={loading || allSelected}
                  className="text-xs"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAllColumns(false)}
                  disabled={loading || noneSelected}
                  className="text-xs"
                >
                  Deselect All
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md p-4 space-y-3 max-h-[300px] overflow-y-auto">
              {columns.map((column) => (
                <div key={column.id} className="flex items-center justify-between">
                  <Label 
                    htmlFor={`column-${column.id}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {column.label}
                  </Label>
                  <Switch
                    id={`column-${column.id}`}
                    checked={column.enabled}
                    onCheckedChange={() => toggleColumn(column.id)}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Format Info */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md text-sm">
            <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-blue-700 dark:text-blue-300">
              Export format: CSV (Comma-Separated Values)
            </p>
          </div>

          {/* Current Filters Info */}
          {currentFilters && Object.keys(currentFilters).length > 0 && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium mb-1">Active Filters:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {currentFilters.search && <li>Search: {currentFilters.search}</li>}
                {currentFilters.status && <li>Status: {currentFilters.status.join(', ')}</li>}
                {currentFilters.priority && <li>Priority: {currentFilters.priority.join(', ')}</li>}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Only tickets matching these filters will be exported (respecting your access permissions)
              </p>
            </div>
          )}

          {/* Progress Bar */}
          {loading && progress > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exporting...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress < 100 && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="text-xs"
                  >
                    Cancel Export
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
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
            disabled={loading || noneSelected}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export {selectedCount} Column{selectedCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
