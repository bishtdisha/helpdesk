'use client';

import { Badge } from '@/components/ui/badge';
import { TicketStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const getStatusConfig = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return {
          label: 'Open',
          variant: 'destructive' as const,
          className: 'bg-red-500 hover:bg-red-600 text-white',
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          variant: 'default' as const,
          className: 'bg-blue-500 hover:bg-blue-600 text-white',
        };
      case 'RESOLVED':
        return {
          label: 'Resolved',
          variant: 'secondary' as const,
          className: 'bg-green-500 hover:bg-green-600 text-white',
        };
      case 'CLOSED':
        return {
          label: 'Closed',
          variant: 'outline' as const,
          className: 'bg-gray-500 hover:bg-gray-600 text-white',
        };
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          className: '',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
