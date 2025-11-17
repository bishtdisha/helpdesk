'use client';

/**
 * Example usage of TicketDetail component
 * 
 * This file demonstrates how to use the TicketDetail component
 * in your application. You can integrate it into:
 * - A modal/dialog
 * - A dedicated page route
 * - A side panel
 */

import { TicketDetail } from './ticket-detail';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Example 1: Using TicketDetail in a Dialog
export function TicketDetailDialog({ 
  ticketId, 
  open, 
  onOpenChange 
}: { 
  ticketId: string; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket Details</DialogTitle>
        </DialogHeader>
        <TicketDetail ticketId={ticketId} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

// Example 2: Using TicketDetail in a full page
export function TicketDetailPage({ ticketId }: { ticketId: string }) {
  return (
    <div className="container mx-auto py-6">
      <TicketDetail ticketId={ticketId} />
    </div>
  );
}

// Example 3: Demo component showing how to trigger the detail view
export function TicketDetailDemo() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Example ticket IDs - replace with real IDs from your data
  const exampleTicketIds = [
    'ticket-id-1',
    'ticket-id-2',
    'ticket-id-3',
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Ticket Detail Component Demo</h2>
      <div className="flex gap-2">
        {exampleTicketIds.map((id) => (
          <Button
            key={id}
            onClick={() => setSelectedTicketId(id)}
            variant="outline"
          >
            View Ticket {id.slice(-1)}
          </Button>
        ))}
      </div>

      {selectedTicketId && (
        <TicketDetailDialog
          ticketId={selectedTicketId}
          open={!!selectedTicketId}
          onOpenChange={(open) => !open && setSelectedTicketId(null)}
        />
      )}
    </div>
  );
}
