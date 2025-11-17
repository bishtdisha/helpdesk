import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, Plus } from 'lucide-react';

interface TicketListEmptyProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onCreateTicket?: () => void;
}

export function TicketListEmpty({
  hasFilters = false,
  onClearFilters,
  onCreateTicket,
}: TicketListEmptyProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
        
        {hasFilters ? (
          <>
            <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              No tickets match your current filters. Try adjusting your search criteria or clear all filters.
            </p>
            {onClearFilters && (
              <Button onClick={onClearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-2">No tickets yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Get started by creating your first support ticket. Track issues, manage customer requests, and collaborate with your team.
            </p>
            {onCreateTicket && (
              <Button onClick={onCreateTicket}>
                <Plus className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
