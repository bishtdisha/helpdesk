'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface SLAViolation {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  slaDueAt: string;
  createdAt: string;
  teamId?: string | null;
  team?: {
    id: string;
    name: string;
  } | null;
  assignedUser?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface SLAViolationFilters {
  teamId?: string;
  priority?: TicketPriority;
}

export function SLAViolationList() {
  const [violations, setViolations] = useState<SLAViolation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<SLAViolationFilters>({});
  const [isExporting, setIsExporting] = useState(false);
  const { canViewAnalytics } = usePermissions();
  const { toast } = useToast();

  // Fetch SLA violations
  const fetchViolations = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{ violations: SLAViolation[] }>(
        '/sla/violations',
        filters
      );
      setViolations(response.violations);
    } catch (error) {
      console.error('Error fetching SLA violations:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch SLA violations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canViewAnalytics()) {
      fetchViolations();
    }
  }, [canViewAnalytics, filters]);

  // Export violations
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Create CSV content
      const headers = ['Ticket ID', 'Title', 'Priority', 'Status', 'Team', 'Assignee', 'SLA Due', 'Overdue By', 'Created'];
      const rows = violations.map(v => {
        const now = new Date();
        const dueDate = new Date(v.slaDueAt);
        const overdueMs = now.getTime() - dueDate.getTime();
        const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
        const overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return [
          v.id,
          `"${v.title.replace(/"/g, '""')}"`,
          v.priority,
          v.status,
          v.team?.name || 'Unassigned',
          v.assignedUser?.name || 'Unassigned',
          format(new Date(v.slaDueAt), 'yyyy-MM-dd h:mm a'),
          `${overdueHours}h ${overdueMinutes}m`,
          format(new Date(v.createdAt), 'yyyy-MM-dd h:mm a'),
        ];
      });

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sla-violations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'SLA violations exported successfully',
      });
    } catch (error) {
      console.error('Error exporting violations:', error);
      toast({
        title: 'Error',
        description: 'Failed to export SLA violations',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Permission guard
  if (!canViewAnalytics()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to view SLA violations.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Priority badge color mapping
  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-white';
      case 'LOW':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Calculate overdue time
  const getOverdueTime = (slaDueAt: string) => {
    const now = new Date();
    const dueDate = new Date(slaDueAt);
    const diff = now.getTime() - dueDate.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              SLA Violations
            </CardTitle>
            <CardDescription>
              Tickets that have breached their SLA deadlines
            </CardDescription>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting || violations.length === 0}
            variant="outline"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <Select
            value={filters.priority || 'all'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                priority: value === 'all' ? undefined : (value as TicketPriority),
              }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : violations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="font-medium">No SLA violations found</p>
            <p className="text-sm mt-2">All tickets are within their SLA targets.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>SLA Due</TableHead>
                  <TableHead>Overdue By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations.map((violation) => (
                  <TableRow key={violation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{violation.title}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {violation.id.slice(0, 8)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(violation.priority)}>
                        {violation.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{violation.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {violation.team?.name || (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {violation.assignedUser?.name || (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">
                          {format(new Date(violation.slaDueAt), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(violation.slaDueAt), 'h:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {getOverdueTime(violation.slaDueAt)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/tickets/${violation.id}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
