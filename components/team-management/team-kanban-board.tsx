"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Clock, 
  User, 
  Plus,
  ArrowLeft,
  Loader2 
} from 'lucide-react';
import { TeamWithMembers } from '@/lib/types/rbac';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { cn } from '@/lib/utils';

interface Ticket {
  id: string;
  ticketNumber: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  customer: {
    name: string;
  } | null;
  assignedUser: {
    name: string;
  } | null;
  createdAt: Date;
  slaDueAt: Date | null;
}

interface TeamKanbanBoardProps {
  team: TeamWithMembers;
  onBack: () => void;
}

const statusColumns = [
  { key: 'OPEN', label: 'New', color: 'bg-blue-500' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-500' },
  { key: 'WAITING_FOR_CUSTOMER', label: 'On Hold', color: 'bg-orange-500' },
  { key: 'RESOLVED', label: 'Resolved', color: 'bg-green-500' },
  { key: 'CLOSED', label: 'Closed', color: 'bg-gray-500' },
];

const priorityStars = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function TeamKanbanBoard({ team, onBack }: TeamKanbanBoardProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamTickets();
  }, [team.id]);

  const fetchTeamTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/tickets?teamId=${team.id}&limit=1000`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team tickets');
      }

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error fetching team tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-500';
      case 'HIGH':
        return 'text-orange-500';
      case 'MEDIUM':
        return 'text-yellow-500';
      case 'LOW':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTicketNumber = (num: number) => {
    return `#${String(num).padStart(5, '0')}`;
  };

  const isOverdue = (slaDueAt: Date | null) => {
    if (!slaDueAt) return false;
    return new Date(slaDueAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchTeamTickets}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{team.name}</h2>
            <p className="text-sm text-muted-foreground">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} • {team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statusColumns.map((column) => {
          const columnTickets = getTicketsByStatus(column.key);
          
          return (
            <div key={column.key} className="flex flex-col gap-3">
              {/* Column Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", column.color)} />
                  <h3 className="font-semibold text-sm">{column.label}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {columnTickets.length}
                </Badge>
              </div>

              {/* Add Ticket Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center border-dashed"
              >
                <Plus className="w-4 h-4" />
              </Button>

              {/* Ticket Cards */}
              <div className="space-y-3 min-h-[200px]">
                {columnTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => window.location.href = `/helpdesk/tickets/${ticket.id}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Ticket Number */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatTicketNumber(ticket.ticketNumber)}
                        </span>
                        {isOverdue(ticket.slaDueAt) && (
                          <Clock className="w-3 h-3 text-destructive" />
                        )}
                      </div>

                      {/* Title */}
                      <p className="text-sm font-medium line-clamp-2">
                        {ticket.title}
                      </p>

                      {/* Customer */}
                      {ticket.customer && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span className="truncate">{ticket.customer.name}</span>
                        </div>
                      )}

                      {/* Priority Stars */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: priorityStars[ticket.priority] }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3 h-3 fill-current",
                              getPriorityColor(ticket.priority)
                            )}
                          />
                        ))}
                      </div>

                      {/* Assigned User Badge */}
                      {ticket.assignedUser && (
                        <Badge variant="outline" className="text-xs">
                          {ticket.assignedUser.name.split(' ')[0]}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
