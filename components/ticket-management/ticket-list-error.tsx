import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface TicketListErrorProps {
  error: Error;
  onRetry?: () => void;
}

export function TicketListError({ error, onRetry }: TicketListErrorProps) {
  return (
    <Card>
      <CardContent className="py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading tickets</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">{error.message || 'An unexpected error occurred while loading tickets.'}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
