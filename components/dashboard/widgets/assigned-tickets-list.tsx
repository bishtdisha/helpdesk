'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock } from "lucide-react";
import useSWR from 'swr';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function AssignedTicketsList() {
  const { data, isLoading, error } = useSWR('/api/dashboard/assigned-tickets', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Tickets Assigned to Me</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Tickets Assigned to Me</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { tickets } = data;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-700 border-red-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'WAITING_FOR_CUSTOMER': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Tickets Assigned to Me</CardTitle>
        <Link href="/dashboard/tickets?assignedTo=me">
          <Button variant="ghost" size="sm" className="text-xs">
            View All
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {tickets && tickets.length > 0 ? (
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {tickets.map((ticket: any) => (
              <Link
                key={ticket.id}
                href={`/dashboard/tickets/${ticket.id}`}
                className={`block p-3 rounded-lg border transition-all hover:shadow-sm ${
                  ticket.priority === 'URGENT' 
                    ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                    : 'bg-background border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        #{ticket.ticketNumber}
                      </span>
                      <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate mb-1">
                      {ticket.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace(/_/g, ' ')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No tickets assigned to you</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
