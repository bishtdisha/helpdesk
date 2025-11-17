'use client';

import { TicketFilters } from './ticket-filters';
import { TicketList } from './ticket-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissions } from '@/lib/hooks/use-permissions';

interface TicketsPageProps {
  onCreateTicket?: () => void;
}

export function TicketsPage({ onCreateTicket }: TicketsPageProps) {
  const permissions = usePermissions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all customer support tickets
          </p>
        </div>
        
        {permissions.canCreateTicket() && onCreateTicket && (
          <Button onClick={onCreateTicket}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        )}
      </div>

      {/* Filters */}
      <TicketFilters />

      {/* Ticket List */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>
            {permissions.canViewAllTickets() && 'All organization tickets'}
            {permissions.canViewTeamTickets() && !permissions.canViewAllTickets() && 'Your team tickets'}
            {!permissions.canViewTeamTickets() && 'Your tickets and followed tickets'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketList onCreateTicket={onCreateTicket} />
        </CardContent>
      </Card>
    </div>
  );
}
