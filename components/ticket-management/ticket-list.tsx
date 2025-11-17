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
import { Eye } from 'lucide-react';
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

  // Merge external filters with pagination params
  const filters: TicketFilters = {
    ...externalFilters,
    page: currentPage,
    limit,
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
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>SLA</TableHead>
            {permissions.canViewTeamTickets() && <TableHead>Assignee</TableHead>}
            {permissions.canViewAllTickets() && <TableHead>Team</TableHead>}
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const isOverdue = ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date();
            return (
              <TableRow 
                key={ticket.id} 
                className={`cursor-pointer hover:bg-muted/50 ${isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
              >
                <TableCell className="font-medium">{ticket.id.slice(0, 8)}</TableCell>
                <TableCell className="max-w-md truncate">{ticket.title}</TableCell>
                <TableCell>
                  <TicketStatusBadge status={ticket.status} />
                </TableCell>
                <TableCell>
                  <TicketPriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell>
                  <SLACountdownTimer slaDueAt={ticket.slaDueAt} status={ticket.status} />
                </TableCell>
                {permissions.canViewTeamTickets() && (
                  <TableCell>
                    {ticket.assignedUser?.name || 'Unassigned'}
                  </TableCell>
                )}
                {permissions.canViewAllTickets() && (
                  <TableCell>{ticket.team?.name || 'No Team'}</TableCell>
                )}
                <TableCell>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTicketClick(ticket.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
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
    <div className="md:hidden space-y-4">
      {tickets.map((ticket) => {
        const isOverdue = ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date();
        return (
          <Card
            key={ticket.id}
            className={`cursor-pointer hover:bg-muted/50 ${isOverdue ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}`}
            onClick={() => handleTicketClick(ticket.id)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {ticket.id.slice(0, 8)}
                    </p>
                    <h3 className="font-semibold">{ticket.title}</h3>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <TicketStatusBadge status={ticket.status} />
                  <TicketPriorityBadge priority={ticket.priority} />
                  <SLACountdownTimer slaDueAt={ticket.slaDueAt} status={ticket.status} />
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  {permissions.canViewTeamTickets() && (
                    <p>Assignee: {ticket.assignedUser?.name || 'Unassigned'}</p>
                  )}
                  {permissions.canViewAllTickets() && ticket.team && (
                    <p>Team: {ticket.team.name}</p>
                  )}
                  <p>Created: {format(new Date(ticket.createdAt), 'MMM d, yyyy')}</p>
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
