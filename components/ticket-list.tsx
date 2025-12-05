'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTickets } from '@/lib/hooks/use-tickets';
import { useTicketUpdates } from '@/lib/hooks/use-ticket-updates';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useKeyboardShortcutsContext } from '@/lib/contexts/keyboard-shortcuts-context';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { useDebouncedCallback, useStableCallback, useMemoizedProps } from '@/lib/performance/memoization';
import { VirtualizedTicketList, TicketListPerformanceMonitor } from '@/components/virtualized-ticket-list';
import { useVirtualScrolling } from '@/lib/performance/virtual-scrolling';
import { TicketFilters, TicketStatus, TicketPriority } from '@/lib/types/ticket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TooltipButton } from '@/components/ui/tooltip-button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TicketStatusBadge } from '@/components/ticket-status-badge';
import { PriorityBadge } from '@/components/priority-badge';
import { BulkActionToolbar } from '@/components/bulk-action-toolbar';
import { BulkActionConfirmationDialog } from '@/components/bulk-action-confirmation-dialog';
import { BulkAssignmentDialog } from '@/components/bulk-assignment-dialog';
import { InlineHelp } from '@/components/ui/inline-help';
import { TicketListOnboarding } from '@/components/ticket-list-onboarding';
import { Search, Filter, Eye, RefreshCw, AlertCircle, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface TicketListProps {
  onTicketClick?: (ticketId: string) => void;
}

export function TicketList({ onTicketClick }: TicketListProps) {
  const router = useRouter();
  const permissions = usePermissions();
  const { registerSearchInput, focusSearch } = useKeyboardShortcutsContext();
  
  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  

  
  // Register search input for keyboard shortcuts
  useEffect(() => {
    if (searchInputRef.current) {
      registerSearchInput(searchInputRef);
    }
  }, [registerSearchInput]);
  
  // Register keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: '/',
      description: 'Focus search input',
      category: 'Navigation',
      handler: (e) => {
        e.preventDefault();
        focusSearch();
      },
    },
    {
      key: '1',
      description: 'Filter by Low priority',
      category: 'Filters',
      handler: () => {
        setPriorityFilter('LOW');
      },
    },
    {
      key: '2',
      description: 'Filter by Medium priority',
      category: 'Filters',
      handler: () => {
        setPriorityFilter('MEDIUM');
      },
    },
    {
      key: '3',
      description: 'Filter by High priority',
      category: 'Filters',
      handler: () => {
        setPriorityFilter('HIGH');
      },
    },
    {
      key: '4',
      description: 'Filter by Urgent priority',
      category: 'Filters',
      handler: () => {
        setPriorityFilter('URGENT');
      },
    },
    {
      key: '5',
      description: 'Clear priority filter',
      category: 'Filters',
      handler: () => {
        setPriorityFilter('all');
      },
    },
  ]);

  
  // Bulk selection state
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  
  // Check if user can perform bulk actions (Admin_Manager or Team_Leader)
  const canPerformBulkActions = permissions.canAssignTicket() || permissions.canViewTeamTickets();

  // Bulk action dialog state
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    type: 'status' | 'assign' | 'close' | null;
    targetStatus?: TicketStatus;
  }>({
    open: false,
    type: null,
  });

  // Bulk action progress state
  const [bulkProgress, setBulkProgress] = useState<{
    current: number;
    total: number;
    successCount: number;
    failureCount: number;
  } | null>(null);

  const [isProcessingBulkAction, setIsProcessingBulkAction] = useState(false);

  // Check if filters are applied (for showing save button)
  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || statusFilter !== 'all' || priorityFilter !== 'all';
  }, [searchTerm, statusFilter, priorityFilter]);

  // Build filters for API
  const filters: TicketFilters = useMemo(() => {
    const f: TicketFilters = {
      page,
      limit: 20,
    };

    if (searchTerm) {
      f.search = searchTerm;
    }

    if (statusFilter !== 'all') {
      f.status = [statusFilter as TicketStatus];
    }

    if (priorityFilter !== 'all') {
      f.priority = [priorityFilter as TicketPriority];
    }

    return f;
  }, [searchTerm, statusFilter, priorityFilter, page]);

  // Fetch tickets with filters
  const { tickets, pagination, isLoading, isError, error, refresh } = useTickets(filters);

  // Check if we should use virtual scrolling
  const shouldUseVirtualScrolling = useVirtualScrolling(tickets.length, 50);

  // Track ticket updates
  const { 
    updatedTickets, 
    newTicketsCount, 
    markTicketAsSeen, 
    markAllAsSeen, 
    isTicketUpdated 
  } = useTicketUpdates(tickets);

  // Memoized handlers to prevent unnecessary re-renders
  const handleTicketClick = useCallback((ticketId: string) => {
    // Mark ticket as seen when clicked
    markTicketAsSeen(ticketId);
    
    if (onTicketClick) {
      onTicketClick(ticketId);
    } else {
      router.push(`/helpdesk/tickets/${ticketId}`);
    }
  }, [markTicketAsSeen, onTicketClick, router]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // Handle mark all as seen
  const handleMarkAllAsSeen = useCallback(() => {
    markAllAsSeen();
  }, [markAllAsSeen]);

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    setPage(1);
  }, 300);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setPage(1);
  }, []);

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(tickets.map(t => t.id));
      setSelectedTicketIds(allIds);
    } else {
      setSelectedTicketIds(new Set());
    }
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    const newSelected = new Set(selectedTicketIds);
    if (checked) {
      newSelected.add(ticketId);
    } else {
      newSelected.delete(ticketId);
    }
    setSelectedTicketIds(newSelected);
  };

  const isAllSelected = tickets.length > 0 && selectedTicketIds.size === tickets.length;
  const isSomeSelected = selectedTicketIds.size > 0 && selectedTicketIds.size < tickets.length;

  // Clear selection when filters change or page changes
  useMemo(() => {
    setSelectedTicketIds(new Set());
  }, [searchTerm, statusFilter, priorityFilter, page]);

  // Bulk action handlers
  const handleBulkStatusUpdate = async (status: TicketStatus) => {
    setBulkActionDialog({
      open: true,
      type: 'status',
      targetStatus: status,
    });
  };

  const handleBulkAssign = async () => {
    setBulkActionDialog({
      open: true,
      type: 'assign',
    });
  };

  const handleBulkClose = async () => {
    setBulkActionDialog({
      open: true,
      type: 'close',
      targetStatus: 'CLOSED',
    });
  };

  const handleClearSelection = () => {
    setSelectedTicketIds(new Set());
  };

  // Execute bulk status update
  const executeBulkStatusUpdate = async () => {
    if (!bulkActionDialog.targetStatus) return;

    const ticketIds = Array.from(selectedTicketIds);
    const targetStatus = bulkActionDialog.targetStatus;

    setIsProcessingBulkAction(true);
    setBulkProgress({
      current: 0,
      total: ticketIds.length,
      successCount: 0,
      failureCount: 0,
    });

    let successCount = 0;
    let failureCount = 0;

    // Process tickets one by one
    for (let i = 0; i < ticketIds.length; i++) {
      const ticketId = ticketIds[i];
      
      try {
        await apiClient.put(`/tickets/${ticketId}`, {
          status: targetStatus,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to update ticket ${ticketId}:`, error);
        failureCount++;
      }

      // Update progress
      setBulkProgress({
        current: i + 1,
        total: ticketIds.length,
        successCount,
        failureCount,
      });
    }

    setIsProcessingBulkAction(false);

    // Show toast notification
    if (successCount > 0) {
      toast.success(
        `Successfully updated ${successCount} ${successCount === 1 ? 'ticket' : 'tickets'}`
      );
    }
    if (failureCount > 0) {
      toast.error(
        `Failed to update ${failureCount} ${failureCount === 1 ? 'ticket' : 'tickets'}`
      );
    }

    // Refresh ticket list
    await refresh();

    // Clear selection after a delay to show results
    setTimeout(() => {
      setSelectedTicketIds(new Set());
      setBulkActionDialog({ open: false, type: null });
      setBulkProgress(null);
    }, 2000);
  };

  // Execute bulk assignment
  const executeBulkAssignment = async (userId: string) => {
    const ticketIds = Array.from(selectedTicketIds);

    setIsProcessingBulkAction(true);
    setBulkProgress({
      current: 0,
      total: ticketIds.length,
      successCount: 0,
      failureCount: 0,
    });

    let successCount = 0;
    let failureCount = 0;

    // Process tickets one by one
    for (let i = 0; i < ticketIds.length; i++) {
      const ticketId = ticketIds[i];
      
      try {
        await apiClient.post(`/tickets/${ticketId}/assign`, {
          userId,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to assign ticket ${ticketId}:`, error);
        failureCount++;
      }

      // Update progress
      setBulkProgress({
        current: i + 1,
        total: ticketIds.length,
        successCount,
        failureCount,
      });
    }

    setIsProcessingBulkAction(false);

    // Show toast notification
    if (successCount > 0) {
      toast.success(
        `Successfully assigned ${successCount} ${successCount === 1 ? 'ticket' : 'tickets'}`
      );
    }
    if (failureCount > 0) {
      toast.error(
        `Failed to assign ${failureCount} ${failureCount === 1 ? 'ticket' : 'tickets'}`
      );
    }

    // Refresh ticket list
    await refresh();

    // Clear selection after a delay to show results
    setTimeout(() => {
      setSelectedTicketIds(new Set());
      setBulkActionDialog({ open: false, type: null });
      setBulkProgress(null);
    }, 2000);
  };

  // Execute bulk action based on type
  const executeBulkAction = async () => {
    if (bulkActionDialog.type === 'status' || bulkActionDialog.type === 'close') {
      await executeBulkStatusUpdate();
    }
  };

  // Get dialog content based on action type
  const getBulkActionDialogContent = () => {
    switch (bulkActionDialog.type) {
      case 'status':
        return {
          title: 'Update Ticket Status',
          description: `Are you sure you want to update the status of the selected tickets to "${bulkActionDialog.targetStatus}"?`,
          warningMessage: undefined,
        };
      case 'close':
        return {
          title: 'Close Tickets',
          description: 'Are you sure you want to close the selected tickets?',
          warningMessage: 'This action will mark all selected tickets as closed.',
        };
      case 'assign':
        return {
          title: 'Assign Tickets',
          description: 'Select a user to assign the selected tickets to.',
          warningMessage: undefined,
        };
      default:
        return {
          title: 'Bulk Action',
          description: 'Confirm bulk action',
          warningMessage: undefined,
        };
    }
  };

  // Loading skeleton
  if (isLoading && tickets.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message || 'Failed to load tickets. Please try again.'}
            </AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <TicketListOnboarding />
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between" data-tour="ticket-list-header">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </div>
            {newTicketsCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  {newTicketsCount} {newTicketsCount === 1 ? 'update' : 'updates'}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMarkAllAsSeen}
                  className="text-xs"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Help message for first-time users */}
            {tickets.length === 0 && !hasActiveFilters && !isLoading && (
              <InlineHelp
                title="Getting Started with Ticket Management"
                variant="info"
                collapsible
                defaultOpen={false}
                links={[
                  { text: "Keyboard Shortcuts Guide", href: "#", external: false },
                  { text: "Filter Documentation", href: "#", external: true }
                ]}
              >
                <div className="space-y-2">
                  <p>Use the search bar to find tickets by title, customer, or ticket ID.</p>
                  <p>Filter by status and priority to focus on specific tickets.</p>
                  <p>Save frequently used filters as presets for quick access.</p>
                  <p><strong>Tip:</strong> Press "/" to quickly focus the search input, or use number keys 1-5 to filter by priority.</p>
                </div>
              </InlineHelp>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative" role="search">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="search"
                    ref={searchInputRef}
                    placeholder="Search tickets, customers, or ticket IDs... (Press / to focus)"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setActivePresetId(null);
                    }}
                    className="pl-10"
                    data-tour="search-input"
                    aria-label="Search tickets by title, customer name, or ticket ID"
                  />
                </div>
              </div>
              <Select 
                value={statusFilter} 
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setActivePresetId(null);
                }}
              >
                <SelectTrigger className="w-[180px]" data-tour="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={priorityFilter} 
                onValueChange={(value) => {
                  setPriorityFilter(value);
                  setActivePresetId(null);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <TooltipButton 
                onClick={handleRefresh} 
                variant="outline" 
                size="icon"
                tooltip="Refresh ticket list"
                shortcut="F5"
                data-tour="refresh-button"
                aria-label={isLoading ? "Refreshing ticket list..." : "Refresh ticket list"}
                aria-busy={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              </TooltipButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Support Tickets
                {selectedTicketIds.size > 0 && (
                  <Badge variant="secondary">
                    {selectedTicketIds.size} selected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {pagination.total > 0
                  ? `Showing ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )} of ${pagination.total} tickets`
                  : 'No tickets found'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tickets found matching your filters.</p>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
                variant="outline"
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              {/* Performance Monitor (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <TicketListPerformanceMonitor 
                  ticketCount={tickets.length} 
                  isVirtualized={shouldUseVirtualScrolling} 
                />
              )}

              {/* Use virtual scrolling for large lists, regular table for smaller ones */}
              {shouldUseVirtualScrolling ? (
                <VirtualizedTicketList
                  tickets={tickets}
                  onTicketClick={(ticket) => handleTicketClick(ticket.id)}
                  isTicketUpdated={isTicketUpdated}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {canPerformBulkActions && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label={`Select all ${tickets.length} tickets on this page`}
                            className={isSomeSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                            data-tour="bulk-checkbox"
                          />
                        </TableHead>
                      )}
                      <TableHead scope="col">Ticket ID</TableHead>
                      <TableHead scope="col">Title</TableHead>
                      <TableHead scope="col">Customer</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Priority</TableHead>
                      {permissions.canViewTeamTickets() && <TableHead scope="col">Assignee</TableHead>}
                      {permissions.canViewTeamTickets() && <TableHead scope="col">Team</TableHead>}
                      <TableHead scope="col">Created</TableHead>
                      <TableHead scope="col">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => {
                      const isUpdated = isTicketUpdated(ticket.id);
                      const isSelected = selectedTicketIds.has(ticket.id);
                      return (
                        <TableRow 
                          key={ticket.id} 
                          className={`cursor-pointer hover:bg-muted/50 ${
                            isUpdated ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500' : ''
                          } ${isSelected ? 'bg-primary/10' : ''}`}
                        >
                          {canPerformBulkActions && (
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                                aria-label={`Select ticket ${ticket.id}`}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {ticket.id.substring(0, 8)}
                              {isUpdated && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  New
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{ticket.title}</TableCell>
                          <TableCell>{ticket.customer.name || ticket.customer.email}</TableCell>
                          <TableCell>
                            <TicketStatusBadge status={ticket.status} />
                          </TableCell>
                          <TableCell>
                            <PriorityBadge priority={ticket.priority} />
                          </TableCell>
                          {permissions.canViewTeamTickets() && (
                            <TableCell>
                              {ticket.assignedUser?.name || 'Unassigned'}
                            </TableCell>
                          )}
                          {permissions.canViewTeamTickets() && (
                            <TableCell>{ticket.team?.name || '-'}</TableCell>
                          )}
                          <TableCell>
                            {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <TooltipButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTicketClick(ticket.id)}
                              tooltip="View ticket details"
                              shortcut="Enter"
                              data-tour="ticket-actions"
                              aria-label={`View details for ticket ${ticket.id.substring(0, 8)} - ${ticket.title}`}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </TooltipButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Toolbar */}
      {canPerformBulkActions && (
        <>
          {selectedTicketIds.size > 0 && selectedTicketIds.size === 1 && (
            <InlineHelp
              title="Bulk Actions Available"
              variant="info"
              dismissible
              collapsible
              defaultOpen={false}
            >
              <p>You can select multiple tickets using the checkboxes to perform bulk operations like status updates, assignments, or closing tickets. This saves time when managing many tickets at once.</p>
            </InlineHelp>
          )}
          <BulkActionToolbar
            selectedCount={selectedTicketIds.size}
            onClearSelection={handleClearSelection}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onBulkAssign={handleBulkAssign}
            onBulkClose={handleBulkClose}
            canAssign={permissions.canAssignTicket()}
          />
        </>
      )}

      {/* Bulk Action Confirmation Dialog */}
      {bulkActionDialog.type !== 'assign' && (
        <BulkActionConfirmationDialog
          open={bulkActionDialog.open}
          onOpenChange={(open) => {
            if (!isProcessingBulkAction) {
              setBulkActionDialog({ open, type: null });
              if (!open) {
                setBulkProgress(null);
              }
            }
          }}
          title={getBulkActionDialogContent().title}
          description={getBulkActionDialogContent().description}
          selectedCount={selectedTicketIds.size}
          onConfirm={executeBulkAction}
          isProcessing={isProcessingBulkAction}
          progress={bulkProgress || undefined}
          warningMessage={getBulkActionDialogContent().warningMessage}
        />
      )}

      {/* Bulk Assignment Dialog */}
      {bulkActionDialog.type === 'assign' && (
        <BulkAssignmentDialog
          open={bulkActionDialog.open}
          onOpenChange={(open) => {
            if (!isProcessingBulkAction) {
              setBulkActionDialog({ open, type: null });
              if (!open) {
                setBulkProgress(null);
              }
            }
          }}
          selectedCount={selectedTicketIds.size}
          onConfirm={executeBulkAssignment}
          isProcessing={isProcessingBulkAction}
          progress={bulkProgress || undefined}
        />
      )}


    </div>
  );
}
