"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  User, 
  Plus,
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
  { key: 'CLOSED', label: 'Cancelled', color: 'bg-gray-500' },
];

export function TeamKanbanBoard({ team, onBack }: TeamKanbanBoardProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is admin or team leader
  const isAdminOrLeader = currentUser?.role?.name === 'Admin/Manager' || 
                          currentUser?.role?.name === 'Team Leader';

  useEffect(() => {
    fetchTeamTickets();
  }, [team.id]);

  const fetchTeamTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== FETCHING TEAM TICKETS ===');
      console.log('Team ID:', team.id);
      console.log('Team Name:', team.name);
      console.log('API URL:', `/api/tickets?teamId=${team.id}&limit=1000`);
      
      // Try fetching with teamId filter first
      const response = await fetch(`/api/tickets?teamId=${team.id}&limit=1000`, {
        credentials: 'include',
      });
      
      // Also try fetching all tickets to see what's available (for debugging)
      const allTicketsResponse = await fetch(`/api/tickets?limit=1000`, {
        credentials: 'include',
      });
      const allTicketsData = await allTicketsResponse.json();
      const allTicketsArray = allTicketsData.tickets || allTicketsData.data || [];
      console.log('=== ALL TICKETS (for debugging) ===');
      console.log('Total tickets in system:', allTicketsArray.length);
      if (allTicketsArray.length > 0) {
        const ticketsWithTeam = allTicketsArray.filter((t: any) => t.team);
        console.log('Tickets with team info:', ticketsWithTeam.length);
        console.log('Team names in system:', [...new Set(ticketsWithTeam.map((t: any) => t.team?.name))]);
        console.log('Tickets for this team (by name):', allTicketsArray.filter((t: any) => t.team?.name === team.name).length);
        console.log('Tickets for this team (by ID):', allTicketsArray.filter((t: any) => t.teamId === team.id).length);
      }

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        throw new Error(errorData.message || `Failed to fetch team tickets (${response.status})`);
      }

      const data = await response.json();
      console.log('=== API RESPONSE ===');
      console.log('Full response:', data);
      
      // Handle different response structures
      const ticketsArray = data.tickets || data.data || [];
      console.log('Total tickets received:', ticketsArray.length);
      
      if (ticketsArray.length > 0) {
        console.log('Sample ticket:', ticketsArray[0]);
        console.log('Ticket statuses:', ticketsArray.map((t: any) => ({ 
          id: t.ticketNumber, 
          status: t.status,
          priority: t.priority 
        })));
        console.log('Status breakdown:', {
          OPEN: ticketsArray.filter((t: any) => t.status === 'OPEN').length,
          IN_PROGRESS: ticketsArray.filter((t: any) => t.status === 'IN_PROGRESS').length,
          WAITING_FOR_CUSTOMER: ticketsArray.filter((t: any) => t.status === 'WAITING_FOR_CUSTOMER').length,
          RESOLVED: ticketsArray.filter((t: any) => t.status === 'RESOLVED').length,
          CLOSED: ticketsArray.filter((t: any) => t.status === 'CLOSED').length,
          OTHER: ticketsArray.filter((t: any) => !['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'].includes(t.status)).length
        });
      }
      
      setTickets(ticketsArray);
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

  const getPriorityBorderColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'URGENT':
        return '#ef4444'; // red-500
      case 'HIGH':
        return '#f97316'; // orange-500
      case 'MEDIUM':
        return '#eab308'; // yellow-500
      case 'LOW':
        return '#3b82f6'; // blue-500
      default:
        return '#6b7280'; // gray-500
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-5 border border-indigo-100 dark:border-indigo-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">{team.name}</h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                <User className="w-3 h-3 text-purple-600" />
                <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                  {team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            {tickets.length === 0 && !loading && (
              <p className="text-xs text-amber-600 mt-2">
                No tickets found for this team.
              </p>
            )}
          </div>
          <Button onClick={() => router.push(`/helpdesk/teams/${team.id}/tickets/new`)} className="shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statusColumns.map((column) => {
          const columnTickets = getTicketsByStatus(column.key);
          
          return (
            <div key={column.key} className="flex flex-col gap-3">
              {/* Column Header */}
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", column.color)} />
                  <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200">{column.label}</h3>
                </div>
                <Badge className={cn(
                  "text-xs font-bold min-w-[24px] justify-center",
                  columnTickets.length > 0 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" 
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                )}>
                  {columnTickets.length}
                </Badge>
              </div>

              {/* Add Ticket Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center border-dashed"
                onClick={() => router.push(`/helpdesk/teams/${team.id}/tickets/new?status=${column.key}`)}
              >
                <Plus className="w-4 h-4" />
              </Button>

              {/* Ticket Cards */}
              <div className="space-y-3 min-h-[200px]">
                {columnTickets.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No tickets
                  </div>
                )}
                {columnTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50"
                    style={{ borderLeftColor: getPriorityBorderColor(ticket.priority) }}
                    onClick={() => {
                      // Navigate to View page first within team context
                      router.push(`/helpdesk/teams/${team.id}/tickets/${ticket.id}/view`);
                    }}
                  >
                    <CardContent className="p-3 space-y-2">
                      {/* Header: Ticket Number and SLA */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                          {formatTicketNumber(ticket.ticketNumber)}
                        </span>
                        {isOverdue(ticket.slaDueAt) && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/50 rounded">
                            <Clock className="w-3 h-3 text-red-600 animate-pulse" />
                            <span className="text-[10px] font-bold text-red-600">SLA</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <p className="text-sm font-semibold line-clamp-2 leading-tight text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {ticket.title}
                      </p>

                      {/* Footer: Customer and Assignee */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        {/* Customer */}
                        {ticket.customer && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <User className="w-3 h-3" />
                            </div>
                            <span className="truncate font-medium">{ticket.customer.name}</span>
                          </div>
                        )}

                        {/* Assigned User */}
                        {ticket.assignedUser && (
                          <Badge className="text-xs px-2 py-0.5 h-5 flex-shrink-0 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-0">
                            {ticket.assignedUser.name.split(' ')[0]}
                          </Badge>
                        )}
                      </div>
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
