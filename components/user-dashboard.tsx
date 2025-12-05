'use client';

/**
 * UserDashboard Component
 * 
 * Dashboard for User_Employee role showing:
 * - Personal ticket statistics
 * - My open tickets
 * - Tickets I'm following
 * - Recent activity
 * 
 * Requirements: 24.1, 24.3, 39.1, 39.2, 39.3, 39.4
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/contexts/auth-context';
import { useTickets } from '@/lib/hooks/use-tickets';
import { Ticket, TicketStatus, TicketPriority } from '@/lib/types/ticket';
import { TicketStatusBadge } from './ticket-status-badge';
import { PriorityBadge } from './priority-badge';
import { 
  User, 
  Ticket as TicketIcon, 
  Clock, 
  CheckCircle, 
  Eye,
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface UserStats {
  totalCreated: number;
  openTickets: number;
  followingCount: number;
  avgResolutionTime: string;
}

export function UserDashboard() {
  const { user, role } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  // Fetch user's tickets (created by user)
  const { tickets: myTickets, isLoading: myTicketsLoading, error } = useTickets({
    // The API will automatically filter by createdBy for User_Employee
  });

  // Debug logging
  console.log('🔍 UserDashboard Debug:', {
    user,
    role,
    myTickets,
    myTicketsLoading,
    error,
    ticketsCount: myTickets.length
  });

  // Calculate statistics from tickets
  const stats: UserStats = {
    totalCreated: myTickets.length,
    openTickets: myTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
    followingCount: myTickets.filter(t => t.followers && t.followers.length > 0).length,
    avgResolutionTime: calculateAvgResolutionTime(myTickets),
  };

  // Filter tickets based on active filter
  const filteredTickets = filterTickets(myTickets, activeFilter);

  // Get tickets user is following (for now, we'll show tickets with followers)
  // In a real implementation, this would be a separate API call
  const followedTickets = myTickets.filter(t => t.followers && t.followers.length > 0);

  // No access check needed - DashboardRouter handles role-based routing
  // This dashboard shows user-specific data regardless of role
  
  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      {user && (
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-900 dark:via-slate-800 dark:to-blue-900">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/20 to-transparent dark:via-blue-700/20"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 dark:from-blue-100 dark:to-blue-300 bg-clip-text text-transparent">
              <div className="p-2 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-700 dark:to-blue-800 shadow-sm">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              Welcome back, {user.name || 'User'}!
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Here's an overview of your tickets and activity.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Personal Statistics - Requirement 39.1, 39.3, 39.4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tickets Created</CardTitle>
            <TicketIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalCreated}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total tickets you've created
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently open or in progress
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Following</CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.followingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tickets you're following
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.avgResolutionTime}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average time to resolve
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Tabs - Requirements 24.1 */}
      <Tabs defaultValue="my-tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>

        {/* My Tickets Tab - Requirement 24.1 */}
        <TabsContent value="my-tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Tickets</CardTitle>
                  <CardDescription>Tickets you have created</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={activeFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={activeFilter === 'open' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter('open')}
                  >
                    Open
                  </Button>
                  <Button
                    variant={activeFilter === 'in_progress' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter('in_progress')}
                  >
                    In Progress
                  </Button>
                  <Button
                    variant={activeFilter === 'resolved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter('resolved')}
                  >
                    Resolved
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {myTicketsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TicketIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tickets found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Following Tab - Requirement 24.1 */}
        <TabsContent value="following" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tickets I'm Following</CardTitle>
              <CardDescription>Tickets you are following for updates</CardDescription>
            </CardHeader>
            <CardContent>
              {myTicketsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : followedTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>You're not following any tickets</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followedTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} showFollowerBadge />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your recent ticket updates and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myTickets.slice(0, 5).map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div>
                    <Link
                      href={`/dashboard/tickets/${ticket.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {ticket.title}
                    </Link>
                    <p className="text-sm text-gray-600">
                      Updated {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TicketStatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
              </div>
            ))}
            {myTickets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Ticket Card Component
 * Displays individual ticket information
 */
interface TicketCardProps {
  ticket: Ticket;
  showFollowerBadge?: boolean;
}

function TicketCard({ ticket, showFollowerBadge }: TicketCardProps) {
  const age = formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true });

  return (
    <Link href={`/dashboard/tickets/${ticket.id}`}>
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 truncate">{ticket.title}</h3>
            {showFollowerBadge && (
              <Badge variant="secondary" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Following
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Created {age}
            {ticket.assignedTo && (
              <span className="ml-2">
                • Assigned to {ticket.assignedTo.name || ticket.assignedTo.email}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <TicketStatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>
    </Link>
  );
}

/**
 * Helper Functions
 */

function calculateAvgResolutionTime(tickets: Ticket[]): string {
  const resolvedTickets = tickets.filter(
    t => t.status === 'RESOLVED' || t.status === 'CLOSED'
  );

  if (resolvedTickets.length === 0) {
    return 'N/A';
  }

  const totalTime = resolvedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.createdAt).getTime();
    const resolved = new Date(ticket.updatedAt).getTime();
    return sum + (resolved - created);
  }, 0);

  const avgTimeMs = totalTime / resolvedTickets.length;
  const avgTimeHours = avgTimeMs / (1000 * 60 * 60);

  if (avgTimeHours < 24) {
    return `${avgTimeHours.toFixed(1)}h`;
  } else {
    const avgTimeDays = avgTimeHours / 24;
    return `${avgTimeDays.toFixed(1)}d`;
  }
}

function filterTickets(
  tickets: Ticket[],
  filter: 'all' | 'open' | 'in_progress' | 'resolved'
): Ticket[] {
  switch (filter) {
    case 'open':
      return tickets.filter(t => t.status === 'OPEN');
    case 'in_progress':
      return tickets.filter(t => t.status === 'IN_PROGRESS');
    case 'resolved':
      return tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
    default:
      return tickets;
  }
}
