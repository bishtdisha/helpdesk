'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTickets } from '@/lib/hooks/use-tickets';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { TicketFilters } from '@/lib/types/ticket';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Pagination } from './pagination';
import { TicketListSkeleton } from './ticket-list-skeleton';
import { TicketListEmpty } from './ticket-list-empty';
import { TicketListError } from './ticket-list-error';
import { TicketStatusBadge } from './ticket-status-badge';
import { TicketPriorityBadge } from './ticket-priority-badge';
import { SLACountdownTimer } from './sla-countdown-timer';

interface TicketListProps {
  filters?: TicketFilters;
  onTicketClick?: (ticketId: string) => void;
  onCreateTicket?: () => void;
}

export function TicketList({ filters: externalFilters = {}, onTicketClick, onCreateTicket }: TicketListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const permissions = usePermissions();

  // Get page from URL or default to 1
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // Get filter values from URL
  const search = searchParams.get('search') || undefined;
  const statusParam = searchParams.get('status');
  const priorityParam = searchParams.get('priority');
  const teamId = searchParams.get('teamId') || undefined;
  const assignedTo = searchParams.get('assignedTo') || undefined;
  const month = searchParams.get('month') || undefined;

  // Merge external filters with URL params and pagination
  const filters: TicketFilters = {
    ...externalFilters,
    page: currentPage,
    limit,
    ...(search && { search }),
    ...(statusParam && statusParam !== 'all' && { status: statusParam }),
    ...(priorityParam && priorityParam !== 'all' && { priority: priorityParam }),
    ...(teamId && teamId !== 'all' && { teamId }),
    ...(assignedTo && assignedTo !== 'all' && { assignedTo }),
    ...(month && month !== 'all' && { month }),
  };

  const { tickets, pagination, isLoading, isError, error, refresh } = useTickets(filters);

  // Update URL when page changes
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Clear all filters
  const handleClearFilters = () => {
    router.push(pathname);
  };

  // Check if any filters are applied
  const hasFilters = searchParams.toString().length > 0;

  const handleTicketClick = (ticketId: string) => {
    if (onTicketClick) {
      onTicketClick(ticketId);
    } else {
      router.push(`/tickets/${ticketId}`);
    }
  };

  // Desktop table view
  const renderTableView = () => (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-2">
            <TableHead className="font-semibold">ID</TableHead>
            <TableHead className="font-semibold">Title</TableHead>
            <TableHead className="font-semibold">Customer</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Priority</TableHead>
            <TableHead className="font-semibold">SLA</TableHead>
            {permissions.canViewTeamTickets() && <TableHead className="font-semibold">Assignee</TableHead>}
            {permissions.canViewAllTickets() && <TableHead className="font-semibold">Team</TableHead>}
            <TableHead className="font-semibold">Created</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const isOverdue = ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date();
            return (
              <TableRow 
                key={ticket.id} 
                className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors group ${isOverdue ? 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/50' : ''}`}
                onClick={() => handleTicketClick(ticket.id)}
              >
                <TableCell className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                  #{String(ticket.ticketNumber).padStart(5, '0')}
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {ticket.title}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-semibold">
                      {ticket.customer?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="truncate text-sm">{ticket.customer?.name || 'Unknown Customer'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <TicketStatusBadge status={ticket.status} />
                </TableCell>
                <TableCell>
                  <TicketPriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell>
                  <SLACountdownTimer slaDueAt={ticket.slaDueAt} createdAt={ticket.createdAt} status={ticket.status} />
                </TableCell>
                {permissions.canViewTeamTickets() && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {ticket.assignedUser ? (
                        <>
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                            {ticket.assignedUser.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm">{ticket.assignedUser.name}</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  </TableCell>
                )}
                {permissions.canViewAllTickets() && (
                  <TableCell>
                    {ticket.team ? (
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-sm">{ticket.team.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No Team</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTicketClick(ticket.id)}
                      title="View ticket"
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        router.push(`/helpdesk/tickets/${ticket.id}/edit`)
                      }}
                      title="Edit ticket"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  // Mobile card view
  const renderCardView = () => (
    <div className="md:hidden space-y-3">
      {tickets.map((ticket) => {
        const isOverdue = ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date();
        return (
          <Card
            key={ticket.id}
            className={`cursor-pointer hover:shadow-md transition-all ${isOverdue ? 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20' : 'border-l-4 border-l-blue-500'}`}
            onClick={() => handleTicketClick(ticket.id)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                      #{String(ticket.ticketNumber).padStart(5, '0')}
                    </p>
                    <h3 className="font-semibold text-base leading-tight">{ticket.title}</h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <TicketStatusBadge status={ticket.status} />
                  <TicketPriorityBadge priority={ticket.priority} />
                  <SLACountdownTimer slaDueAt={ticket.slaDueAt} createdAt={ticket.createdAt} status={ticket.status} />
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-semibold">
                      {ticket.customer?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-muted-foreground">
                      {ticket.customer?.name || 'Unknown Customer'}
                    </span>
                  </div>
                  {permissions.canViewTeamTickets() && ticket.assignedUser && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                        {ticket.assignedUser.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-muted-foreground">{ticket.assignedUser.name}</span>
                    </div>
                  )}
                  {permissions.canViewAllTickets() && ticket.team && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span>{ticket.team.name}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Created {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <TicketListSkeleton />
      </div>
    );
  }

  // Error state
  if (isError && error) {
    return <TicketListError error={error} onRetry={refresh} />;
  }

  // Empty state
  if (tickets.length === 0) {
    return (
      <TicketListEmpty
        hasFilters={hasFilters}
        onClearFilters={handleClearFilters}
        onCreateTicket={onCreateTicket}
      />
    );
  }

  return (
    <div className="space-y-4">
      {renderTableView()}
      {renderCardView()}
      
      {/* Pagination */}
      {pagination.totalPages > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
