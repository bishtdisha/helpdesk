'use client';

import { useMemo, useCallback } from 'react';
import { VirtualTable, useVirtualScrolling } from '@/lib/performance/virtual-scrolling';
import { TicketStatusBadge } from './ticket-status-badge';
import { PriorityBadge } from './priority-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Ticket } from '@/lib/types/ticket';
import { format } from 'date-fns';
import { Eye, Clock } from 'lucide-react';

interface VirtualizedTicketListProps {
  tickets: Ticket[];
  onTicketClick?: (ticket: Ticket) => void;
  isTicketUpdated?: (ticketId: string) => boolean;
  className?: string;
}

export function VirtualizedTicketList({
  tickets,
  onTicketClick,
  isTicketUpdated,
  className,
}: VirtualizedTicketListProps) {
  const shouldUseVirtualScrolling = useVirtualScrolling(tickets.length, 50);

  // Memoized columns configuration
  const columns = useMemo(() => [
    {
      key: 'id',
      header: 'ID',
      width: '100px',
      render: (ticket: Ticket) => (
        <div className="font-mono text-sm">
          {ticket.id.slice(-8)}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      width: '2fr',
      render: (ticket: Ticket) => (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{ticket.title}</div>
            <div className="text-sm text-muted-foreground truncate">
              {ticket.customer?.name || 'Unknown Customer'}
            </div>
          </div>
          {isTicketUpdated?.(ticket.id) && (
            <Badge variant="secondary" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              New
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (ticket: Ticket) => (
        <TicketStatusBadge status={ticket.status} />
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '100px',
      render: (ticket: Ticket) => (
        <PriorityBadge priority={ticket.priority} />
      ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      width: '150px',
      render: (ticket: Ticket) => (
        <div className="flex items-center gap-2">
          {ticket.assignedTo ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarImage src={ticket.assignedTo.avatar} />
                <AvatarFallback className="text-xs">
                  {ticket.assignedTo.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm truncate">{ticket.assignedTo.name}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'sla',
      header: 'SLA',
      width: '120px',
      render: (ticket: Ticket) => {
        if (!ticket.slaDueAt) {
          return <span className="text-sm text-muted-foreground">No SLA</span>;
        }

        const now = new Date();
        const dueDate = new Date(ticket.slaDueAt);
        const isOverdue = now > dueDate;
        const timeRemaining = dueDate.getTime() - now.getTime();
        const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));

        if (isOverdue) {
          return (
            <Badge variant="destructive" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          );
        }

        if (hoursRemaining < 2) {
          return (
            <Badge variant="destructive" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {hoursRemaining}h
            </Badge>
          );
        }

        if (hoursRemaining < 8) {
          return (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {hoursRemaining}h
            </Badge>
          );
        }

        return (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {hoursRemaining}h
          </Badge>
        );
      },
    },
    {
      key: 'created',
      header: 'Created',
      width: '120px',
      render: (ticket: Ticket) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(ticket.createdAt), 'MMM dd, HH:mm')}
        </div>
      ),
    },
  ], [isTicketUpdated]);

  // Memoized item key function
  const getItemKey = useCallback((ticket: Ticket, index: number) => ticket.id, []);

  // Memoized click handler
  const handleItemClick = useCallback((ticket: Ticket) => {
    onTicketClick?.(ticket);
  }, [onTicketClick]);

  // If we don't need virtual scrolling, render a regular table
  if (!shouldUseVirtualScrolling) {
    return (
      <div className="border rounded-lg">
        {/* Table Header */}
        <div className="grid border-b bg-muted/50 font-medium text-sm">
          <div 
            className="grid gap-4 px-4 py-3"
            style={{
              gridTemplateColumns: columns.map(col => col.width || '1fr').join(' '),
            }}
          >
            {columns.map((column) => (
              <div key={column.key} className="font-medium">
                {column.header}
              </div>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div>
          {tickets.map((ticket, index) => (
            <div
              key={ticket.id}
              className="grid gap-4 px-4 py-3 border-b hover:bg-muted/50 transition-colors cursor-pointer"
              style={{
                gridTemplateColumns: columns.map(col => col.width || '1fr').join(' '),
              }}
              onClick={() => handleItemClick(ticket)}
            >
              {columns.map((column) => (
                <div key={column.key} className="flex items-center">
                  {column.render(ticket, index)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Use virtual scrolling for large lists
  return (
    <VirtualTable
      items={tickets}
      columns={columns}
      itemHeight={60}
      containerHeight={600}
      className={className}
      getItemKey={getItemKey}
      onItemClick={handleItemClick}
    />
  );
}

// Performance monitoring component
export function TicketListPerformanceMonitor({ 
  ticketCount, 
  isVirtualized 
}: { 
  ticketCount: number; 
  isVirtualized: boolean; 
}) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
      Tickets: {ticketCount} | Virtual: {isVirtualized ? 'Yes' : 'No'}
    </div>
  );
}