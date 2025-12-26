'use client';

/**
 * Following Tickets Widget
 * 
 * Shows tickets the user is following but not assigned to
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { Ticket } from '@/lib/types/ticket';
import { TicketStatusBadge } from '@/components/ticket-management/ticket-status-badge';
import { PriorityBadge } from '@/components/ticket-management/priority-badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface FollowingTicketsResponse {
  tickets: Ticket[];
  count: number;
}

export function FollowingTicketsWidget() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followingTickets, setFollowingTickets] = useState<Ticket[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchFollowingTickets = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<FollowingTicketsResponse>(
          `/api/users/${user.id}/following-tickets`
        );
        setFollowingTickets(response.tickets);
        setCount(response.count);
      } catch (error) {
        console.error('Error fetching following tickets:', error);
        setFollowingTickets([]);
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowingTickets();
  }, [user?.id]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-500" />
            <div>
              <CardTitle className="text-base">Following</CardTitle>
              <CardDescription className="text-xs">
                Tickets you&apos;re following
              </CardDescription>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <Badge variant="secondary" className="text-sm font-semibold">
                {count}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : followingTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">You&apos;re not following any tickets</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {followingTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/helpdesk/tickets/${ticket.id}`}
                  className="block"
                >
                  <div className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 font-mono">
                          #{ticket.ticketNumber}
                        </span>
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {ticket.title}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600">
                        {ticket.assignedUser ? (
                          <>
                            Assigned to {ticket.assignedUser.name || ticket.assignedUser.email}
                          </>
                        ) : (
                          'Unassigned'
                        )}
                        {' • '}
                        {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <TicketStatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
